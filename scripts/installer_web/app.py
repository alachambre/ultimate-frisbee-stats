"""Flask application for the Monkey Statistics agent tools installer."""

from __future__ import annotations

from pathlib import Path

from flask import Flask, Response, jsonify, render_template, request

from . import engine


def create_app() -> Flask:
    app = Flask(
        __name__,
        template_folder=str(Path(__file__).parent / "templates"),
        static_folder=str(Path(__file__).parent / "static"),
    )
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0

    @app.after_request
    def security_headers(response: Response) -> Response:
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Cache-Control"] = "no-store"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "connect-src 'self'; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "frame-ancestors 'none'"
        )
        return response

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/api/catalog")
    def api_catalog():
        scope = request.args.get("scope", "project")
        try:
            return jsonify(engine.get_catalog(scope))
        except SystemExit as exc:
            return jsonify({"error": str(exc)}), 422

    @app.route("/api/layout")
    def api_layout():
        scope = request.args.get("scope", "project")
        try:
            return jsonify(engine.get_layout(scope))
        except SystemExit as exc:
            return jsonify({"error": str(exc)}), 422

    @app.route("/api/preview", methods=["POST"])
    def api_preview():
        data = request.get_json(silent=True) or {}
        try:
            result = engine.preview_install(
                data.get("scope", "project"),
                data.get("selectedSkills", []),
                data.get("selectedAgents", []),
            )
            return jsonify(result)
        except SystemExit as exc:
            return jsonify({"error": str(exc)}), 422
        except Exception as exc:
            return jsonify({"error": f"Preview failed: {exc}"}), 500

    @app.route("/api/install", methods=["POST"])
    def api_install():
        data = request.get_json(silent=True) or {}
        try:
            result = engine.execute_install(
                data.get("scope", "project"),
                data.get("selectedSkills", []),
                data.get("selectedAgents", []),
            )
            return jsonify(result)
        except SystemExit as exc:
            return jsonify({"error": str(exc)}), 422
        except Exception as exc:
            return jsonify({"error": f"Install failed: {exc}"}), 500

    return app
