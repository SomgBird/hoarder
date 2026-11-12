"""Print the API contract without starting the server or its database lifespan."""
import json
import sys

from app.main import app


if __name__ == "__main__":
    json.dump(app.openapi(), sys.stdout, sort_keys=True)
    sys.stdout.write("\n")
