import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Ultimate Frisbee Stats Tracker
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Track your team's performance, game by game, point by point
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-12">
          <Link
            to="/teams"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Manage Teams
            </h2>
            <p className="text-gray-600">
              Create and manage your team roster
            </p>
          </Link>

          <Link
            to="/games"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Track Games
            </h2>
            <p className="text-gray-600">
              Record games and track point-by-point stats
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
