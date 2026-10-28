import { Link } from "react-router-dom";
import { getRelativeTime } from "../common/date";
import Avatar from "./Avatar";
import Icon from "./Icon";
import Loader from "./loader.component";
import { usePollVoters } from "../hooks/queries";

const PollVotersModal = ({ blogId, poll, isOpen, onClose }) => {

    const { data, isLoading } = usePollVoters(blogId, isOpen);

    if (!isOpen) return null;

    const voters = data?.voters || [];

    // Group voters by option_index
    const votersByOption = {};
    if (poll?.options) {
        poll.options.forEach((opt, i) => {
            votersByOption[i] = {
                text: opt.text,
                votes: opt.votes || 0,
                voters: [],
            };
        });
    }
    voters.forEach(v => {
        if (votersByOption[v.option_index]) {
            votersByOption[v.option_index].voters.push(v);
        }
    });

    return (
        <div className="poll-voters-overlay" onClick={onClose}>
            <div className="poll-voters-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="poll-voters-modal__header">
                    <div className="flex items-center gap-2">
                        <Icon name="poll" className="text-xl" />
                        <h2 className="text-lg font-semibold">Poll Voters</h2>
                    </div>
                    <button onClick={onClose} className="poll-voters-modal__close" aria-label="Close poll voters">
                        <Icon name="close" className="text-xl" />
                    </button>
                </div>

                {/* Summary */}
                <div className="poll-voters-modal__summary">
                    <span className="text-dark-grey text-sm">
                        {voters.length} total vote{voters.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Content */}
                <div className="poll-voters-modal__content">
                    {isLoading ? (
                        <Loader />
                    ) : voters.length === 0 ? (
                        <div className="poll-voters-modal__empty">
                            <Icon name="poll" className="text-4xl text-dark-grey/30" />
                            <p className="text-dark-grey text-sm mt-2">No votes yet</p>
                        </div>
                    ) : (
                        Object.entries(votersByOption).map(([index, option]) => (
                            <div key={index} className="poll-voters-modal__option-group">
                                <div className="poll-voters-modal__option-header">
                                    <span className="poll-voters-modal__option-text">
                                        {option.text}
                                    </span>
                                    <span className="poll-voters-modal__option-count">
                                        {option.voters.length} vote{option.voters.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                {option.voters.length > 0 ? (
                                    <div className="poll-voters-modal__voter-list">
                                        {option.voters.map((voter, i) => (
                                            <Link
                                                key={i}
                                                to={`/user/${voter.user?.personal_info?.username}`}
                                                className="poll-voters-modal__voter"
                                            >
                                                <Avatar
                                                    src={voter.user?.personal_info?.profile_img}
                                                    alt={voter.user?.personal_info?.fullname}
                                                    size={36}
                                                />
                                                <div className="poll-voters-modal__voter-info">
                                                    <span className="poll-voters-modal__voter-name">
                                                        {voter.user?.personal_info?.fullname}
                                                    </span>
                                                    <span className="poll-voters-modal__voter-meta">
                                                        @{voter.user?.personal_info?.username} · {getRelativeTime(voter.createdAt)}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-dark-grey/50 text-xs px-3 py-2">No votes for this option</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PollVotersModal;
