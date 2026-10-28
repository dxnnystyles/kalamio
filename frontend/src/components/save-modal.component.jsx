import { useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { UserContext } from "../App";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../common/queryKeys";
import { useArticleCollections } from "../hooks/queries";
import api from "../common/api";
import Icon from "./Icon";
import toast from "react-hot-toast";

const SaveModal = ({ blogId, isOpen, onClose }) => {
    const { userAuth: { access_token } } = useContext(UserContext);
    const queryClient = useQueryClient();
    const [collections, setCollections] = useState([]);
    const [seeded, setSeeded] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newVisibility, setNewVisibility] = useState("private");
    const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Shared, cached collections query — usually already fetched when the post menu opened, so the
    // modal opens instantly from cache instead of loading from scratch.
    const { data: fetchedCollections } = useArticleCollections(blogId, { enabled: isOpen });
    const loading = !seeded;

    // Invalidate the collections caches when the modal closes so the menu icon + saved state refresh.
    const handleClose = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.collections.isSaved(blogId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.collections.forArticle(blogId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.collections.all() });
        onClose();
    };

    // Seed editable local state from the (cached) query the first time data is available per open, and
    // default the save to "Read Later" (YouTube-style) — but only when the article isn't already in a
    // collection, so we never re-add one the user just removed.
    useEffect(() => {
        if (!isOpen) { setSeeded(false); setCollections([]); return; }
        if (seeded || !fetchedCollections) return;

        let cols = fetchedCollections;
        const savedAnywhere = cols.some(c => c.contains_article);
        const readLater = cols.find(c => c.is_default);
        if (!savedAnywhere && readLater) {
            cols = cols.map(c => c._id === readLater._id
                ? { ...c, contains_article: true, total_articles: c.total_articles + 1 }
                : c);
            api.post("/collection/add-article", { collection_id: readLater._id, blog_id: blogId })
                .catch(() => {});
        }
        setCollections(cols);
        setSeeded(true);
    }, [isOpen, fetchedCollections, seeded, blogId]);

    // Freeze background scroll while the sheet is open. The desktop home layout has a position:sticky
    // right sidebar; freezing the window's scroll container unsticks it, so it drops to the top of the
    // document and scrolls off-screen when the modal is opened from a scrolled-down post. To keep it in
    // place, we PIN it: measure its current (stuck) rect BEFORE locking, fix it there for the duration,
    // then restore on close. Reserving the scrollbar width keeps the feed from shifting under the pin.
    useEffect(() => {
        if (!isOpen) return;

        const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
        const sidebar = document.querySelector(".home-sidebar");
        const layout = sidebar ? sidebar.parentElement : null; // .home-layout (the flex container)
        const prevSidebarStyle = sidebar ? sidebar.style.cssText : null;
        const prevLayoutStyle = layout ? layout.style.cssText : null;
        if (sidebar) {
            const r = sidebar.getBoundingClientRect();
            sidebar.style.position = "fixed";
            sidebar.style.top = `${r.top}px`;
            sidebar.style.left = `${r.left}px`;
            sidebar.style.width = `${r.width}px`;
            // Pinning removes the sidebar from the flex flow, so reserve its slot with padding on the
            // container — otherwise the margin:auto-centered feed slides over into the freed space.
            if (layout) layout.style.paddingRight = `${r.width}px`;
        }

        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;

        return () => {
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
            document.body.style.paddingRight = "";
            if (sidebar) sidebar.style.cssText = prevSidebarStyle;
            if (layout) layout.style.cssText = prevLayoutStyle;
        };
    }, [isOpen]);

    const toggleCollection = (collectionId, currentlyContains) => {
        const endpoint = currentlyContains ? "/collection/remove-article" : "/collection/add-article";

        // Optimistic update
        setCollections(prev => prev.map(c =>
            c._id === collectionId
                ? { ...c, contains_article: !currentlyContains, total_articles: c.total_articles + (currentlyContains ? -1 : 1) }
                : c
        ));

        api.post(endpoint, { collection_id: collectionId, blog_id: blogId })
            .catch(() => {
                // Revert on error
                setCollections(prev => prev.map(c =>
                    c._id === collectionId
                        ? { ...c, contains_article: currentlyContains, total_articles: c.total_articles + (currentlyContains ? 1 : -1) }
                        : c
                ));
                toast.error("Failed to update collection");
            });
    };

    const handleCreate = () => {
        if (!newTitle.trim()) return;
        setCreating(true);

        api.post("/collection/create", { title: newTitle.trim(), visibility: newVisibility })
            .then(({ data }) => {
                // Add the new collection and then add article to it
                const newCol = {
                    _id: data.collection._id,
                    title: data.collection.title,
                    slug: data.collection.slug,
                    visibility: data.collection.visibility,
                    is_default: false,
                    total_articles: 0,
                    contains_article: false
                };
                setCollections(prev => [...prev, newCol]);
                setNewTitle("");
                setNewVisibility("private");
                setCreating(false);
                setShowCreateForm(false);

                // Auto-add article to the new collection
                toggleCollection(data.collection._id, false);
                toast.success(`Created "${data.collection.title}"`);
            })
            .catch(err => {
                toast.error(err.response?.data?.error || "Failed to create collection");
                setCreating(false);
            });
    };

    const handleCancelCreate = () => {
        setShowCreateForm(false);
        setShowVisibilityDropdown(false);
        setNewTitle("");
        setNewVisibility("private");
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="save-modal__portal" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <div className="save-modal__backdrop" onClick={handleClose} />
            <div className="save-modal">
                <div className="save-modal__header">
                    <h3>Save to...</h3>
                    <button className="save-modal__close" onClick={handleClose} aria-label="Close save dialog">
                        <Icon name="close" />
                    </button>
                </div>

                <div className="save-modal__list">
                    {loading ? (
                        <div className="save-modal__skeleton">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="save-modal__skeleton-row">
                                    <span className="save-modal__skeleton-bar" style={{ width: `${60 - i * 8}%` }} />
                                    <span className="save-modal__skeleton-dot" />
                                </div>
                            ))}
                        </div>
                    ) : collections.length === 0 ? (
                        <div className="save-modal__empty">No collections yet. Create one below!</div>
                    ) : (
                        collections.map(col => (
                            <div
                                key={col._id}
                                className={"save-modal__item cursor-pointer" + (col.contains_article ? " save-modal__item--selected" : "")}
                                onClick={() => toggleCollection(col._id, col.contains_article)}
                            >
                                <div className="save-modal__item-info">
                                    <span className="save-modal__item-title">
                                        {col.is_default && <Icon name="schedule" className="text-sm mr-1" />}
                                        {col.title}
                                    </span>
                                    <span className="save-modal__item-meta">
                                        {col.total_articles} {col.total_articles === 1 ? 'article' : 'articles'}
                                        {col.visibility !== 'private' && (
                                            <span className="save-modal__visibility-badge">
                                                <Icon name={col.visibility === 'public' ? 'public' : 'link'} className="text-xs" />
                                                {col.visibility}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="save-modal__checkbox-icon">
                                    <Icon name="bookmark" filled={col.contains_article} className="text-3xl" />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="save-modal__create">
                    {!showCreateForm ? (
                        <button
                            className="save-modal__new-btn"
                            onClick={() => setShowCreateForm(true)}
                        >
                            <Icon name="add" className="text-lg" />
                            New collection
                        </button>
                    ) : (
                        <div className="save-modal__create-form">
                            <input
                                type="text"
                                placeholder="Collection name"
                                className="save-modal__create-input"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && newTitle.trim()) handleCreate(); }}
                                maxLength={100}
                                autoFocus
                            />

                            <div className="save-modal__field">
                                <label className="save-modal__field-label">Visibility</label>
                                <div
                                    className="save-modal__visibility"
                                    tabIndex={0}
                                    onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setShowVisibilityDropdown(false); }}
                                >
                                    <button
                                        type="button"
                                        className="save-modal__create-select"
                                        onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                                    >
                                        <span className="flex items-center gap-1.5 capitalize">
                                            <Icon name={newVisibility === 'public' ? 'public' : newVisibility === 'unlisted' ? 'link' : 'lock'} className="text-sm" />
                                            {newVisibility}
                                        </span>
                                        <Icon name="expand_more" className="text-lg text-dark-grey" />
                                    </button>

                                    {showVisibilityDropdown && (
                                        <div className="save-modal__visibility-menu">
                                            {['private', 'unlisted', 'public'].map(opt => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    className={"save-modal__visibility-option" + (newVisibility === opt ? " is-active" : "")}
                                                    onClick={() => { setNewVisibility(opt); setShowVisibilityDropdown(false); }}
                                                >
                                                    <span className="flex items-center gap-1.5 capitalize">
                                                        <Icon name={opt === 'public' ? 'public' : opt === 'unlisted' ? 'link' : 'lock'} className="text-sm" />
                                                        {opt}
                                                    </span>
                                                    {newVisibility === opt && <Icon name="check" className="text-sm" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="save-modal__form-actions">
                                <button className="save-modal__cancel-btn" onClick={handleCancelCreate}>
                                    Cancel
                                </button>
                                <button
                                    className="save-modal__create-btn"
                                    onClick={handleCreate}
                                    disabled={!newTitle.trim() || creating}
                                >
                                    {creating ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SaveModal;
