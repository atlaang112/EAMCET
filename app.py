import os
from flask import Flask
from flask_cors import CORS
from routes.student import student_bp
from routes.admin import admin_bp

app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = os.getenv("SECRET_KEY", "eamcet_secret_key_2026_change_in_prod")

CORS(app)

app.register_blueprint(student_bp)
app.register_blueprint(admin_bp)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
