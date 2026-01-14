interface ErrorStateProps {
  message: string;
  title?: string;
}

export default function ErrorState({
  message,
  title = "Error",
}: ErrorStateProps) {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">{title}</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
