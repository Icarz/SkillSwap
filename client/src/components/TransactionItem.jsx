import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ProposeSwapModal from "../components/ProposeSwapModal";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-200 text-gray-600",
  "proposed-swap": "bg-purple-100 text-purple-700",
  "accepted-swap": "bg-blue-100 text-blue-700",
  "rejected-swap": "bg-red-100 text-red-700",
};

const TransactionItem = ({
  tx,
  actionLoading = {}, 
  onAccept = () => {},
  onComplete = () => {},
  onCancel = () => {},
  onDelete = () => {},
  onAction = () => {}, 
}) => {
  const { user } = useAuth();
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  const isAnotherUsersOpenRequest =
    tx.type === "request" &&
    tx.user?._id !== user?.id &&
    !tx.acceptor &&
    tx.status === "pending";

  const isUsersTransaction = tx.user?._id === user?.id;
  const isProposedSwap = tx.status === "proposed-swap";
  const isAcceptedSwap = tx.status === "accepted-swap";

  const handleSwapSuccess = () => {
    window.location.reload();
  };

  return (
    <>
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
              className={`px-2 py-1 rounded text-xs font-semibold ${
                statusColors[tx.status]
              }`}
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
                to={`/profile/${tx.acceptor._id}`}
                className="text-accent hover:underline"
              >
                {tx.acceptor.name}
              </Link>
            </div>
          )}

          {/* Display swap information */}
          {tx.linkedTransaction && (
            <div className="text-xs text-purple-600">
              {isProposedSwap && "Swap proposed"}
              {isAcceptedSwap && "Swap accepted"}
              {tx.status === "rejected-swap" && "Swap rejected"}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-2 md:mt-0">
          {/* Propose Swap Button */}
          {isAnotherUsersOpenRequest && (
            <button
              className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 text-xs"
              onClick={() => setIsSwapModalOpen(true)}
            >
              Propose Swap
            </button>
          )}

          {/* Accept/Reject Swap Buttons (for transaction owner) */}
          {isProposedSwap && isUsersTransaction && (
            <>
              <button
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-xs"
                onClick={() => onAction(tx._id, "accepted-swap")}
                disabled={actionLoading[tx._id]}
              >
                {actionLoading[tx._id] ? "Processing..." : "Accept Swap"}
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs"
                onClick={() => onAction(tx._id, "rejected-swap")}
                disabled={actionLoading[tx._id]}
              >
                {actionLoading[tx._id] ? "Processing..." : "Reject Swap"}
              </button>
            </>
          )}

          {/* Waiting message for non-owners of proposed swaps */}
          {isProposedSwap && !isUsersTransaction && (
            <span className="text-xs text-gray-500 italic">
              Waiting for response...
            </span>
          )}

          {/* Original action buttons (conditionally hidden during swaps) */}
          {!isProposedSwap && !isAcceptedSwap && (
            <>
              {tx.status === "pending" &&
                tx.type === "request" &&
                !tx.acceptor && (
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs"
                    onClick={() => onAccept(tx._id)}
                    disabled={actionLoading[tx._id]}
                  >
                    {actionLoading[tx._id] ? "Processing..." : "Accept"}
                  </button>
                )}
              {tx.status === "accepted" && (
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-xs"
                  onClick={() => onComplete(tx._id)}
                  disabled={actionLoading[tx._id]}
                >
                  {actionLoading[tx._id] ? "Processing..." : "Complete"}
                </button>
              )}
              {tx.status === "pending" && (
                <button
                  className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-xs"
                  onClick={() => onCancel(tx._id)}
                  disabled={actionLoading[tx._id]}
                >
                  {actionLoading[tx._id] ? "Processing..." : "Cancel"}
                </button>
              )}
            </>
          )}

          {/* Delete button (always available) */}
          <button
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs"
            onClick={() => onDelete(tx._id)}
            disabled={actionLoading[tx._id]}
          >
            {actionLoading[tx._id] ? "Deleting..." : "Delete"}
          </button>
        </div>
      </li>

      {isSwapModalOpen && (
        <ProposeSwapModal
          targetTransaction={tx}
          onClose={() => setIsSwapModalOpen(false)}
          onSuccess={handleSwapSuccess}
        />
      )}
    </>
  );
};

export default TransactionItem;
