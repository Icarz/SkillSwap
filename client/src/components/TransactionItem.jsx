import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ProposeSwapModal from "../components/ProposeSwapModal";

const statusConfig = {
  pending:         { label: "Pending",       classes: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  accepted:        { label: "In Progress",   classes: "bg-accent/10 text-accent border border-accent/20" },
  completed:       { label: "Done",          classes: "bg-green-50 text-green-700 border border-green-200" },
  cancelled:       { label: "Cancelled",     classes: "bg-gray-100 text-gray-500 border border-gray-200" },
  "proposed-swap": { label: "Swap Proposed", classes: "bg-purple-50 text-purple-700 border border-purple-200" },
  "accepted-swap": { label: "Swap Accepted", classes: "bg-teal-50 text-teal-700 border border-teal-200" },
  "rejected-swap": { label: "Swap Rejected", classes: "bg-red-50 text-red-700 border border-red-200" },
};

const typeConfig = {
  offer:   { label: "Offering",   classes: "bg-primary/10 text-primary border border-primary/20" },
  request: { label: "Requesting", classes: "bg-secondary/10 text-secondary border border-secondary/20" },
};

const Avatar = ({ name, size = "sm" }) => {
  const dim = size === "sm" ? "w-5 h-5 text-[10px]" : "w-7 h-7 text-xs";
  return (
    <span className={`${dim} rounded-full bg-accent/20 text-secondary font-bold flex items-center justify-center shrink-0`}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </span>
  );
};

const TransactionItem = ({
  tx,
  actionLoading = {},
  onAccept,
  onComplete,
  onCancel,
  onDelete,
  onAction,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  const isAnotherUsersOpenRequest =
    tx.type === "request" &&
    tx.user?._id !== user?.id &&
    !tx.acceptor &&
    tx.status === "pending";

  const isUsersTransaction    = tx.user?._id === user?.id;
  const isProposedSwap        = tx.status === "proposed-swap";
  const isAcceptedSwap        = tx.status === "accepted-swap";
  const isLoading             = actionLoading[tx._id];

  // Direct profile swap proposals
  const isDirectProposal      = !!tx.targetUser && !tx.linkedTransaction;
  const isDirectProposalForMe = isDirectProposal && tx.targetUser?._id === user?.id && isProposedSwap;
  const isMyDirectProposal    = isDirectProposal && isUsersTransaction && isProposedSwap;

  const statusCfg = statusConfig[tx.status] ?? { label: tx.status, classes: "bg-gray-100 text-gray-500 border border-gray-200" };
  const typeCfg   = typeConfig[tx.type]     ?? { label: tx.type,   classes: "bg-gray-100 text-gray-500 border border-gray-200" };

  const hasActions = onAccept || onComplete || onCancel || onDelete || onAction;

  return (
    <>
      <li className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200">

        {/* Header: skill name + badges + date */}
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-primary">
              {tx.skill?.name?.replace(/-/g, " ") || "Unknown Skill"}
            </h3>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${typeCfg.classes}`}>
              {typeCfg.label}
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusCfg.classes}`}>
              {statusCfg.label}
            </span>
          </div>
          <span className="text-[11px] text-secondary/40 shrink-0">
            {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* Meta: owner + acceptor */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-secondary/60 mb-3">
          {tx.user && (
            <div className="flex items-center gap-1.5">
              <Avatar name={tx.user.name} />
              <span>
                by{" "}
                <Link
                  to={`/profile/${tx.user._id}`}
                  className="font-semibold text-secondary hover:text-primary transition-colors"
                >
                  {tx.user.name}
                </Link>
              </span>
            </div>
          )}
          {tx.acceptor && (
            <div className="flex items-center gap-1.5">
              <Avatar name={tx.acceptor.name} />
              <span>
                accepted by{" "}
                <Link
                  to={`/profile/${tx.acceptor._id}`}
                  className="font-semibold text-secondary hover:text-primary transition-colors"
                >
                  {tx.acceptor.name}
                </Link>
              </span>
            </div>
          )}
        </div>

        {/* In Progress banner */}
        {tx.status === "accepted" && tx.acceptor && (
          <div className="flex items-center gap-3 mb-3 px-3 py-2.5 bg-accent/5 border border-accent/20 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
            <div className="flex items-center gap-2 text-xs font-semibold text-accent flex-wrap">
              <span>In Progress</span>
              <span className="text-secondary/30">·</span>
              <div className="flex items-center gap-1.5 text-secondary/70 font-normal">
                <Avatar name={tx.user?.name} />
                <Link to={`/profile/${tx.user?._id}`} className="hover:text-primary transition-colors font-semibold">
                  {tx.user?.name}
                </Link>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <Avatar name={tx.acceptor?.name} />
                <Link to={`/profile/${tx.acceptor?._id}`} className="hover:text-primary transition-colors font-semibold">
                  {tx.acceptor?.name}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Done banner */}
        {tx.status === "completed" && tx.acceptor && (
          <div className="flex items-center gap-3 mb-3 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex items-center gap-2 text-xs font-semibold text-green-700 flex-wrap">
              <span>Done</span>
              <span className="text-green-300">·</span>
              <div className="flex items-center gap-1.5 text-green-800/70 font-normal">
                <Avatar name={tx.user?.name} />
                <Link to={`/profile/${tx.user?._id}`} className="hover:text-green-900 transition-colors font-semibold">
                  {tx.user?.name}
                </Link>
                <span className="text-green-400">&amp;</span>
                <Avatar name={tx.acceptor?.name} />
                <Link to={`/profile/${tx.acceptor?._id}`} className="hover:text-green-900 transition-colors font-semibold">
                  {tx.acceptor?.name}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Linked swap banner */}
        {tx.linkedTransaction && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-700 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {isProposedSwap  && "Swap proposal pending response"}
            {isAcceptedSwap  && "Swap accepted — both parties agreed"}
            {tx.status === "rejected-swap" && "Swap was declined"}
          </div>
        )}

        {/* Direct profile swap banner */}
        {isDirectProposal && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-violet-50 border border-violet-100 rounded-xl text-xs text-violet-700 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>
              Direct swap: <strong>{tx.skill?.name?.replace(/-/g, " ")}</strong>
              {tx.requestedSkill && <> → <strong>{tx.requestedSkill.name?.replace(/-/g, " ")}</strong></>}
              {isDirectProposalForMe && <span className="ml-1 text-violet-500">· {tx.user?.name} wants to swap with you</span>}
              {isMyDirectProposal    && <span className="ml-1 text-violet-500">· Sent to {tx.targetUser?.name}</span>}
              {tx.status === "accepted" && <span className="ml-1 text-teal-600">· Accepted</span>}
              {tx.status === "cancelled" && <span className="ml-1 text-gray-500">· Declined</span>}
            </span>
          </div>
        )}

        {/* Actions */}
        {hasActions && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">

            {/* Propose Swap */}
            {isAnotherUsersOpenRequest && onAction && (
              <button
                className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                onClick={() => setIsSwapModalOpen(true)}
                disabled={isLoading}
              >
                Propose Swap
              </button>
            )}

            {/* Accept / Decline direct swap proposal */}
            {isDirectProposalForMe && onAccept && onCancel && (
              <>
                <button
                  className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                  onClick={() => onAccept(tx._id)}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing…" : "Accept Swap"}
                </button>
                <button
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                  onClick={() => onCancel(tx._id)}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing…" : "Decline"}
                </button>
              </>
            )}

            {/* Waiting indicator for my direct proposal */}
            {isMyDirectProposal && (
              <span className="flex items-center gap-1.5 text-xs text-secondary/50 italic">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
                Waiting for {tx.targetUser?.name}…
              </span>
            )}

            {/* Accept / Reject Swap */}
            {isProposedSwap && isUsersTransaction && !isDirectProposal && onAction && (
              <>
                <button
                  className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                  onClick={() => onAction(tx._id, "accepted-swap")}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing…" : "Accept Swap"}
                </button>
                <button
                  className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                  onClick={() => onAction(tx._id, "rejected-swap")}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing…" : "Reject Swap"}
                </button>
              </>
            )}

            {/* Waiting indicator (linked swap) */}
            {isProposedSwap && !isUsersTransaction && !isDirectProposal && (
              <span className="flex items-center gap-1.5 text-xs text-secondary/50 italic">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                Waiting for response…
              </span>
            )}

            {/* Standard actions */}
            {!isProposedSwap && !isAcceptedSwap && (
              <>
                {tx.status === "pending" && !tx.acceptor && !isUsersTransaction && onAccept && (
                  <button
                    className="px-3 py-1.5 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-accent text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                    onClick={() => onAccept(tx._id)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing…" : "Accept"}
                  </button>
                )}
                {tx.status === "accepted" && onComplete && (
                  <button
                    className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                    onClick={() => onComplete(tx._id)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing…" : "Complete"}
                  </button>
                )}
                {tx.status === "pending" && onCancel && (
                  <button
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                    onClick={() => onCancel(tx._id)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing…" : "Cancel"}
                  </button>
                )}
              </>
            )}

            {/* Delete — pushed to the right */}
            {onDelete && (
              <button
                className="ml-auto px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl border border-red-100 transition-colors disabled:opacity-50"
                onClick={() => onDelete(tx._id)}
                disabled={isLoading}
              >
                {isLoading ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
        )}
      </li>

      {isSwapModalOpen && (
        <ProposeSwapModal
          targetTransaction={tx}
          onClose={() => setIsSwapModalOpen(false)}
          onSuccess={() => { setIsSwapModalOpen(false); onRefresh?.(); }}
        />
      )}
    </>
  );
};

export default TransactionItem;
