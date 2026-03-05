import sys
import os

# Menambahkan path folder backend_ai ke system path
sys.path.insert(0, os.path.dirname(__file__))

# Import app sebagai 'application' agar dideteksi oleh Passenger
from app import app as application
