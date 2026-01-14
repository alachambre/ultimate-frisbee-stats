import { Link } from "react-router-dom";
import type { Team } from "../../types";

interface TeamCardProps {
  team: Team;
}

export default function TeamCard({ team }: TeamCardProps) {
  return (
    <Link
      to={`/teams/${team.id}`}
      className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {team.name}
      </h2>
      <p className="text-sm text-gray-500">
        Created {new Date(team.created_at).toLocaleDateString()}
      </p>
    </Link>
  );
}
