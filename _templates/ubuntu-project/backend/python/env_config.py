"""
Environment Configuration
Loads environment variables from root .env file
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)


class Config:
    """Application configuration from environment variables"""

    # Database - MySQL
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', '3306'))
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
    MYSQL_DB_NAME = os.getenv('MYSQL_DB_NAME', '')

    @property
    def mysql_url(self):
        """MySQL connection URL"""
        return f"mysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB_NAME}"

    # Database - PostgreSQL
    POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
    POSTGRES_PORT = int(os.getenv('POSTGRES_PORT', '5432'))
    POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', '')
    POSTGRES_DB_NAME = os.getenv('POSTGRES_DB_NAME', '')

    @property
    def postgres_url(self):
        """PostgreSQL connection URL"""
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB_NAME}"

    # Server
    BE_PYTHON_PORT = int(os.getenv('BE_PYTHON_PORT', '8000'))
    NODE_ENV = os.getenv('NODE_ENV', 'development')

    # CORS
    CORS_ORIGIN = os.getenv('CORS_ORIGIN', 'http://localhost:3000')


# Create config instance
config = Config()
