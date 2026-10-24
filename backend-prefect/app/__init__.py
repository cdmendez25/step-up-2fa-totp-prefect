"""Backend Step-Up 2FA.

Carga el .env antes que cualquier otro import: Prefect lee PREFECT_API_URL
en el momento en que se importa, así que tiene que estar listo antes.
"""

from dotenv import load_dotenv

load_dotenv()
