interface PageHeaderProps {
  title: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

export default function PageHeader({
  title,
  actionLabel = "Add",
  onActionClick,
}: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      {onActionClick && (
        <button
          onClick={onActionClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
