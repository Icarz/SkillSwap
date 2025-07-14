import { Link } from "react-router-dom";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-200 text-gray-600",
};

const TransactionItem = ({
  tx,
  actionLoading,
  onAccept,
  onComplete,
  onCancel,
  onDelete,
}) => (
  <li className="flex flex-col md:flex-row md:items-center justify-between bg-light rounded p-4 gap-2">
    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
      <div>
        <span className="font-semibold text-secondary capitalize">
          {tx.type}
        </span>{" "}
        <span className="text-primary font-medium">
          {tx.skill?.name?.replace(/-/g, " ") || "Unknown Skill"}
        </span>
      </div>
      <div>
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[tx.status]}`}
        >
          {tx.status}
        </span>
      </div>
      <div className="text-xs text-gray-400">
        {new Date(tx.createdAt).toLocaleDateString()}
      </div>
      {tx.acceptor && (
        <div className="text-xs text-secondary">
          Accepted by:{" "}
          <Link
            to={`/profile/${tx.acceptor}`}
            className="text-accent hover:underline"
          >
            {tx.acceptor}
          </Link>
        </div>
      )}
    </div>
    {/* Actions */}
    <div className="flex gap-2 mt-2 md:mt-0">
      {/* Accept (if pending and not your own offer) */}
      {tx.status === "pending" && tx.type === "request" && !tx.acceptor && (
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs"
          onClick={() => onAccept(tx._id)}
          disabled={actionLoading[tx._id]}
        >
          {actionLoading[tx._id] ? "Processing..." : "Accept"}
        </button>
      )}
      {/* Complete (if accepted and you are the acceptor) */}
      {tx.status === "accepted" && (
        <button
          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-xs"
          onClick={() => onComplete(tx._id)}
          disabled={actionLoading[tx._id]}
        >
          {actionLoading[tx._id] ? "Processing..." : "Mark as Completed"}
        </button>
      )}
      {/* Cancel (if pending) */}
      {tx.status === "pending" && (
        <button
          className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-xs"
          onClick={() => onCancel(tx._id)}
          disabled={actionLoading[tx._id]}
        >
          {actionLoading[tx._id] ? "Processing..." : "Cancel"}
        </button>
      )}
      {/* Delete (always allowed for your own transactions) */}
      <button
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs"
        onClick={() => onDelete(tx._id)}
        disabled={actionLoading[tx._id]}
      >
        {actionLoading[tx._id] ? "Deleting..." : "Delete"}
      </button>
    </div>
  </li>
);

export default TransactionItem;