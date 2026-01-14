interface EmptyTeamsStateProps {
  onCreateClick: () => void;
}

export default function EmptyTeamsState({
  onCreateClick,
}: EmptyTeamsStateProps) {
  return (
    <div className="text-center py-12 bg-white rounded-lg shadow">
      <p className="text-gray-600 mb-4">No teams yet</p>
      <button
        onClick={onCreateClick}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Create Your First Team
      </button>
    </div>
  );
}
