import { Link } from "react-router-dom";
import { getDay } from "../common/date";
import { useContext, useState } from "react";
import { UserContext } from "../App";
import Icon from "./Icon";
import { cdnUrl } from "../common/cdn";
import { useDeleteBlog } from "../hooks/mutations";
import ConfirmModal from "./confirm-modal.component";

const BlogStats = ({ stats }) => {
    return (
        <div className="flex gap-2 max-lg:mb-6 max-lg:pb-6 border-border max-lg:border-b">
            {
                Object.keys(stats).map((key, i) => {
                    return !key.includes("parent") ? 
                    <div key={i} className={"flex flex-col items-center w-full h-full justify-center p-4 px-6 " + (i != 0 ? " border-border border-l " : "")}>
                        <h1 className="text-xl lg:text-2xl mb-2 font-semibold">{stats[key].toLocaleString()}</h1>
                        <p className="max-lg:text-dark-grey capitalize text-sm">{key.split("_")[1]}</p>
                    </div> : ""
                })
            }
        </div>
    )
}

export const ManagePublishedBlogsCard = ({ blog, isSelected, onToggleSelect }) => {

    let { banner, blog_id, title, publishedAt, activity, type, text_content } = blog;
    const isTextPost = type === 'text_post';

    let [ showStat, setShowStat ] = useState(false);
    let [ showDeleteConfirm, setShowDeleteConfirm ] = useState(false);

    // TanStack Query mutation — invalidates blogs.all on success
    const deleteMutation = useDeleteBlog();

    const displayTitle = isTextPost
        ? (text_content ? text_content.substring(0, 80) + (text_content.length > 80 ? '...' : '') : 'Text Post')
        : title;

    return (
        <>
            <div className="flex gap-4 lg:gap-10 border-b mb-6 max-md:px-4 border-border pb-6 items-center">

                {/* Checkbox for bulk select */}
                {onToggleSelect && (
                    <button
                        onClick={onToggleSelect}
                        className="flex-none text-dark-grey hover:text-black transition-colors"
                        aria-label={`${isSelected ? "Deselect" : "Select"} ${displayTitle || "post"}`}
                    >
                        <Icon name={isSelected ? "check_box" : "check_box_outline_blank"} className="text-[22px]" />
                    </button>
                )}

                {!isTextPost && banner && (
                    <img src={cdnUrl(banner)} className="max-md:hidden lg:hidden xl:block w-28 h-28 flex-none bg-grey object-cover rounded-radius-md" alt={title} />
                )}

                <div className="flex flex-col justify-between py-2 w-full min-w-[300px]">

                    <div>
                        {isTextPost && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-radius-sm bg-grey text-dark-grey mr-2">Text Post</span>
                        )}
                        <Link to={`/blog/${blog_id}`} className="blog-title mb-4 hover:text-black transition-colors">{displayTitle}</Link>

                        <p className="line-clamp-1 text-dark-grey text-sm mt-1">Published on {getDay(publishedAt)}</p>
                    </div>

                    <div className="flex gap-6 mt-3">
                        {!isTextPost && (
                            <Link to={`/editor/${blog_id}`} className="text-dark-grey hover:text-black transition-colors flex items-center gap-1 text-sm font-medium">
                                <Icon name="edit" className="text-xl" />
                                Edit
                            </Link>
                        )}

                        <button className="lg:hidden text-dark-grey hover:text-black transition-colors flex items-center gap-1 text-sm font-medium" onClick={() => setShowStat(preVal => !preVal)}>
                            <Icon name="bar_chart" className="text-xl" />
                            Stats
                        </button>

                        <button 
                            className="text-red hover:text-red/80 transition-colors flex items-center gap-1 text-sm font-medium" 
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={deleteMutation.isPending}
                        >
                            <Icon name="delete" className="text-xl" />
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </button>

                    </div>

                </div>

                <div className="max-lg:hidden">
                    <BlogStats stats={activity} />
                </div>

            </div>

            {
                showStat ? <div className="lg:hidden"><BlogStats stats={activity} /></div> : ""
            }

            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Delete this blog?"
                message={`"${displayTitle}" will be permanently deleted along with its reads, likes and comments. This cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={() => { setShowDeleteConfirm(false); deleteMutation.mutate({ blog_id }); }}
                onCancel={() => setShowDeleteConfirm(false)}
            />

        </>
    )
}

export const ManageDraftBlogPost = ({ blog }) => {

    let { title, des, blog_id, index, type, text_content } = blog;
    const isTextPost = type === 'text_post';

    const deleteMutation = useDeleteBlog();

    let [ showDeleteConfirm, setShowDeleteConfirm ] = useState(false);

    const displayTitle = isTextPost
        ? (text_content ? text_content.substring(0, 80) + (text_content.length > 80 ? '...' : '') : 'Text Post')
        : title;

    index++;

    return (
        <>
        <div className="flex gap-5 lg:gap-10 pb-6 border-b mb-6 border-border">

            <h1 className="blog-index text-center pl-4 md:pl-6 flex-none">{ index < 10 ? "0" + index : index }</h1>

            <div>
                {isTextPost && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-radius-sm bg-grey text-dark-grey mr-2">Text Post</span>
                )}
                <Link to={`/blog/${blog_id}`} className="blog-title mb-3 hover:text-black transition-colors">{displayTitle}</Link>

                <p className="line-clamp-2 text-dark-grey text-sm">{ des?.length ? des : (isTextPost ? '' : "No Description") }</p>

                <div className="flex gap-6 mt-3">
                    {!isTextPost && (
                        <Link to={`/editor/${blog_id}`} className="text-dark-grey hover:text-black transition-colors flex items-center gap-1 text-sm font-medium">
                            <Icon name="edit" className="text-xl" />
                            Edit
                        </Link>
                    )}

                    <button 
                        className="text-red hover:text-red/80 transition-colors flex items-center gap-1 text-sm font-medium" 
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={deleteMutation.isPending}
                    >
                        <Icon name="delete" className="text-xl" />
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </button>

                </div>

            </div>
        </div>

        <ConfirmModal
            isOpen={showDeleteConfirm}
            title="Delete this draft?"
            message={`"${displayTitle}" will be permanently deleted. This cannot be undone.`}
            confirmLabel="Delete"
            variant="danger"
            onConfirm={() => { setShowDeleteConfirm(false); deleteMutation.mutate({ blog_id }); }}
            onCancel={() => setShowDeleteConfirm(false)}
        />
        </>
    )
}
