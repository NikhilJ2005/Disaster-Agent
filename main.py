from flask import Flask
from flask_restx import Api, Resource, fields, Namespace
from flask_cors import CORS
from crewai import Crew, Task, Process, Agent, LLM
from crewai_tools import SerperDevTool
from pymongo import MongoClient
import os
from datetime import datetime
import openai
from typing import List, Dict, Any

# Initialize the Flask app
app = Flask(__name__)

# Apply CORS settings
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize Flask-RestX API
api = Api(
    app,
    version='1.0',
    title='Disaster Preparedness Assistant API',
    description='API for managing AI-powered disaster preparedness and response system',
    doc='/'
)

# Environment Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")

# Initialize the SambaNova client
client = openai.OpenAI(
    api_key=os.environ.get("SAMBANOVA_API_KEY"),
    base_url="https://api.sambanova.ai/v1",
)

class SambanovaLLM:
    def __init__(self):
        self.client = client

    def invoke(self, messages: List[Dict[str, Any]], **kwargs) -> str:
        response = self.client.chat.completions.create(
            model='Meta-Llama-3.1-8B-Instruct',
            messages=[{
                "role": msg["role"],
                "content": msg["content"]
            } for msg in messages],
            temperature=0.1,
            top_p=0.1
        )
        return response.choices[0].message.content

# Initialize the custom LLM
llm = SambanovaLLM()

# Global variables for MongoDB collections
db = None
tasks_collection = None
agents_collection = None
feedback_collection = None
crew_logs_collection = None

def init_mongodb():
    """Initialize MongoDB connection and collections"""
    global db, tasks_collection, agents_collection, feedback_collection, crew_logs_collection

    if not MONGODB_URI:
        print("MONGODB_URI environment variable is not set.")
        return False

    try:
        client = MongoClient(MONGODB_URI)
        client.admin.command('ping')

        db = client['disaster_prep_db']
        tasks_collection = db['tasks']
        agents_collection = db['agents']
        feedback_collection = db['feedback']
        crew_logs_collection = db['crew_logs']

        print("Successfully connected to MongoDB Atlas")
        return True
    except Exception as e:
        print(f"Error connecting to MongoDB Atlas: {str(e)}")
        return False

# Create namespaces
crew_ns = Namespace('crew', description='Crew operations')
task_ns = Namespace('tasks', description='Task operations')
agent_ns = Namespace('agents', description='Agent operations')
system_ns = Namespace('system', description='System operations')

api.add_namespace(crew_ns)
api.add_namespace(task_ns)
api.add_namespace(agent_ns)
api.add_namespace(system_ns)

# Response models
task_model = api.model('Task', {
    'task_id': fields.String(required=True, description='Task identifier'),
    'description': fields.String(required=True, description='Task description'),
    'status': fields.String(required=True, description='Current task status'),
    'created_at': fields.DateTime(description='Task creation timestamp'),
    'updated_at': fields.DateTime(description='Last update timestamp'),
    'assigned_agent': fields.String(description='Assigned agent name')
})

feedback_model = api.model('Feedback', {
    'feedback': fields.String(required=True, description='User feedback content'),
    'rating': fields.Integer(description='Numerical rating (1-5)', min=1, max=5)
})

# Initialize CrewAI components
llm = LLM(
    model="groq/llama-3.1-70b-versatile",
    api_key=GROQ_API_KEY
)

search_tool = SerperDevTool(api_key=SERPER_API_KEY)

def initialize_agents():
    """Initialize specialized disaster preparedness agents"""
    if not agents_collection:
        print("MongoDB collections not initialized")
        return {}

    agents = {}
    try:
        # Define default disaster preparedness agents
        default_agents = [
            # (Agent definitions)
        ]

        # Clear existing agents and insert default ones
        agents_collection.delete_many({})
        agents_collection.insert_many(default_agents)

        # Create Agent objects
        for agent_data in default_agents:
            agent = Agent(
                role=agent_data['role'],
                goal=agent_data['goal'],
                verbose=True,
                backstory=agent_data['backstory'],
                llm=llm,
                tools=[search_tool]
            )
            agents[agent_data['name']] = agent

        return agents
    except Exception as e:
        print(f"Error initializing agents: {str(e)}")
        return {}

def initialize_tasks(agents):
    """Initialize disaster preparedness tasks"""
    if not tasks_collection:
        print("MongoDB collections not initialized")
        return []

    tasks = []
    try:
        # Define default disaster preparedness tasks
        default_tasks = [
            # (Task definitions)
        ]

        # Clear existing tasks and insert default ones
        tasks_collection.delete_many({})
        tasks_collection.insert_many(default_tasks)

        # Create Task objects
        for task_data in default_tasks:
            agent = agents.get(task_data['assigned_agent'])
            if agent:
                task = Task(
                    description=task_data['description'],
                    expected_output=task_data['expected_output'],
                    agent=agent
                )
                tasks.append(task)

        return tasks
    except Exception as e:
        print(f"Error initializing tasks: {str(e)}")
        return []

# Initialize MongoDB and components
if init_mongodb():
    agents = initialize_agents()
    tasks = initialize_tasks(agents)
    crew = Crew(
        agents=list(agents.values()),
        tasks=tasks,
        process=Process.sequential
    )
else:
    print("Failed to initialize MongoDB. Some features may not work properly.")
    agents = {}
    tasks = []
    crew = None

# API models for frontend
message_model = api.model('Message', {
    'content': fields.String(required=True),
    'role': fields.String(required=True),
})

response_model = api.model('Response', {
    'content': fields.String(required=True),
    'timestamp': fields.DateTime(required=True)
})

# Crew endpoints
@crew_ns.route('/start')
class CrewStart(Resource):
    @crew_ns.doc('start_crew')
    def post(self):
        """Start executing the disaster preparedness tasks."""
        if not crew:
            return {'error': 'Crew not initialized'}, 500

        try:
            crew_logs_collection.insert_one({
                'action': 'crew_start',
                'timestamp': datetime.utcnow(),
                'status': 'started'
            })

            result = crew.kickoff()

            crew_logs_collection.insert_one({
                'action': 'crew_complete',
                'timestamp': datetime.utcnow(),
                'status': 'completed',
                'result': str(result)
            })

            return {
                'message': 'Disaster preparedness assessment and planning completed successfully!',
                'result': str(result)
            }, 200
        except Exception as e:
            if crew_logs_collection:
                crew_logs_collection.insert_one({
                    'action': 'crew_error',
                    'timestamp': datetime.utcnow(),
                    'error': str(e)
                })
            return {'error': str(e)}, 500

# Task endpoints
@task_ns.route('/')
class TaskList(Resource):
    @task_ns.doc('list_tasks')
    @task_ns.marshal_list_with(task_model)
    def get(self):
        """List all disaster preparedness tasks."""
        if not tasks_collection:
            return [], 500
        return list(tasks_collection.find())

# System endpoints
@api.route('/health')
class HealthCheck(Resource):
    @system_ns.doc('health_check')
    def get(self):
        """Check system health status."""
        mongodb_status = 'disconnected'
        if db:
            try:
                db.command('ping')
                mongodb_status = 'connected'
            except Exception:
                pass

        return {
            'status': 'healthy' if mongodb_status == 'connected' else 'degraded',
            'mongodb_status': mongodb_status,
            'timestamp': datetime.utcnow().isoformat()
        }, 200

# Error handlers
@api.errorhandler(Exception)
def handle_error(error):
    if crew_logs_collection:
        crew_logs_collection.insert_one({
            'type': 'error',
            'timestamp': datetime.utcnow(),
            'error': str(error),
            'code': getattr(error, 'code', 500)
        })
    return {'message': str(error)}, getattr(error, 'code', 500)

if __name__ == '__main__':
    print("Disaster Preparedness Assistant is running. Access the API documentation at http://127.0.0.1:5000")
    app.run(debug=True)
