interface EmptyPlayersStateProps {
  onAddClick: () => void;
}

export default function EmptyPlayersState({
  onAddClick,
}: EmptyPlayersStateProps) {
  return (
    <div className="text-center py-8">
      <p className="text-gray-600 mb-4">No players yet</p>
      <button
        onClick={onAddClick}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Add First Player
      </button>
    </div>
  );
}
