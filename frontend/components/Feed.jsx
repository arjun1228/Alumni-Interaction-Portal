import React, { useState, useRef } from 'react';
import { MessageSquare, Heart, Share2, Award, Briefcase, Lightbulb, Send, Image, X, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { UserRole } from '../types';
import { createPost, likePost, uploadImage, deletePost, enhancePostText } from '../services/api';
import { useToast } from './Toast';

export const Feed = ({ posts, setPosts, currentUser, hashtagFilter, setHashtagFilter }) => {
  const toast = useToast();
  const [filter, setFilter] = useState('ALL');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState('GENERAL');
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [copiedPostId, setCopiedPostId] = useState(null);
  
  // Image attachment state
  const [postImageUrl, setPostImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // AI Enhance state
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedPreview, setEnhancedPreview] = useState(null); // null = no preview
  const [enhanceError, setEnhanceError] = useState('');

  const handleShare = (postId) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopiedPostId(postId);
        setTimeout(() => setCopiedPostId(null), 2000);
        toast('Link copied to clipboard! \ud83d\udd17', 'info', 2000);
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        toast('Could not copy link \u2014 please try manually.', 'error', 2500);
      });
  };

  const handleEnhance = async () => {
    if (!newPostContent.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setEnhanceError('');
    setEnhancedPreview(null);
    try {
      // Map frontend type to backend category
      const categoryMap = { GENERAL: 'General', ADVICE: 'Career Advice', ACHIEVEMENT: 'Achievement' };
      const category = categoryMap[newPostType] || 'General';
      const result = await enhancePostText(newPostContent, category);
      setEnhancedPreview(result);
    } catch (err) {
      console.error('Enhance failed:', err);
      setEnhanceError(err.message || "Couldn't enhance right now — try again");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUseEnhanced = () => {
    if (enhancedPreview) {
      setNewPostContent(enhancedPreview);
      setEnhancedPreview(null);
      setEnhanceError('');
      toast('✨ Enhanced text applied!', 'info', 2000);
    }
  };

  const handleDismissEnhanced = () => {
    setEnhancedPreview(null);
    setEnhanceError('');
  };

  const filteredPosts = filter === 'ALL' ? posts : posts.filter(post => post.type === filter);
  const displayedPosts = hashtagFilter
    ? filteredPosts.filter(post => post.content?.toLowerCase().includes(hashtagFilter.toLowerCase()))
    : filteredPosts;

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setPostImageUrl(url);
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const postData = {
      author: currentUser,
      content: newPostContent,
      timestamp: 'Just now', // Server should ideally handle this, but keeping frontend logic
      type: newPostType,
      likes: 0,
      likedBy: [],
      comments: 0,
      commentsList: [],
      tags: [],
      image: postImageUrl || undefined
    };

    try {
      const savedPost = await createPost(postData);
      setPosts([savedPost, ...posts]);
      setNewPostContent('');
      setNewPostType('GENERAL');
      setPostImageUrl('');
      toast('Post published to the community! 🚀', 'success');
    } catch (error) {
      console.error("Failed to create post", error);
      toast(error.message || "Failed to save post — please try again.", 'error');
    }
  };

  const handleLike = async (postId) => {
    try {
      const updatedPost = await likePost(postId, currentUser.id || currentUser._id);
      setPosts(posts.map(post => (post.id === postId || post._id === postId) ? updatedPost : post));
      const isNowLiked = updatedPost.likedBy?.includes(currentUser.id || currentUser._id);
      if (isNowLiked) toast('❤️ Liked!', 'success', 1800);
    } catch (error) {
      console.error("Failed to like post", error);
      toast('Could not update like — try again.', 'error', 2500);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Delete this post permanently?")) {
      try {
        await deletePost(postId);
        setPosts(posts.filter(p => (p.id || p._id) !== postId));
        toast('Post deleted.', 'info', 2500);
      } catch (err) {
        console.error("Failed to delete post", err);
        toast(err.message || "Failed to delete post.", 'error');
      }
    }
  };

  const toggleComments = (postId) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      setCommentText('');
    }
  };

  const handlePostComment = (e, postId) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      content: commentText,
      timestamp: 'Just now'
    };

    setPosts(posts.map(post => {
      if (post.id === postId || post._id === postId) {
        return {
          ...post,
          comments: post.comments + 1,
          commentsList: [...(post.commentsList || []), newComment]
        };
      }
      return post;
    }));
    setCommentText('');
  };

  return (
    <div className="space-y-6 text-slate-805 dark:text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-805 dark:text-white">Community Feed</h1>
          {hashtagFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900 rounded-full text-xs font-semibold animate-in zoom-in duration-200">
              Tag: {hashtagFilter}
              <button 
                onClick={() => { if (setHashtagFilter) setHashtagFilter(null); }} 
                className="hover:text-indigo-900 dark:hover:text-indigo-200 focus:outline-none cursor-pointer"
                aria-label="Clear Tag Filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              if (setHashtagFilter) setHashtagFilter(null);
            }}
            className="bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Posts</option>
            <option value="ACHIEVEMENT">Achievements</option>
            <option value="ADVICE">Advice</option>
            <option value="GENERAL">General</option>
          </select>
        </div>
      </div>

      {/* Create Post Section - Alumni and Admin only */}
      {(currentUser.role === UserRole.GRADUATE || currentUser.role === 'alumni' || currentUser.role === UserRole.ADMIN || currentUser.role === 'admin') && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <div className="flex gap-3">
            <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <form onSubmit={handleCreatePost}>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share an update, advice, or opportunity..."
                  className="w-full form-input-custom rounded-lg p-3 text-sm resize-none"
                  rows={3}
                />
                
                {isUploading && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 animate-pulse mt-2">Uploading photo to Cloudinary...</p>
                )}

                {postImageUrl && (
                  <div className="mt-2 relative h-28 max-w-xs rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                    <img src={postImageUrl} className="w-full h-full object-cover" alt="Post upload preview" />
                    <button type="button" onClick={() => setPostImageUrl('')} className="absolute top-2 right-2 bg-slate-950/60 hover:bg-slate-950 text-white p-1 rounded-full cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* AI Enhanced Preview */}
                {enhancedPreview && (
                  <div className="mt-3 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-xl p-4 animate-in slide-in-from-top duration-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">AI Suggestion</span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{enhancedPreview}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={handleUseEnhanced}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        ✓ Use this
                      </button>
                      <button
                        type="button"
                        onClick={handleDismissEnhanced}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                      >
                        Keep original
                      </button>
                    </div>
                  </div>
                )}

                {/* Enhance error */}
                {enhanceError && (
                  <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <X className="w-3 h-3" /> {enhanceError}
                  </p>
                )}

                <div className="flex justify-between items-center mt-3">
                  <div className="flex gap-2 items-center">
                    <select
                      value={newPostType}
                      onChange={(e) => setNewPostType(e.target.value)}
                      className="text-xs form-input-custom rounded-md px-2 py-1"
                    >
                      <option value="GENERAL">General</option>
                      <option value="ADVICE">Career Advice</option>
                      <option value="ACHIEVEMENT">Achievement</option>
                    </select>
                    
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={handleImageUploadClick}
                      disabled={isUploading}
                      className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 disabled:opacity-50 cursor-pointer"
                      aria-label="Attach image"
                    >
                      <Image className="w-4 h-4" />
                    </button>

                    {/* AI Enhance button */}
                    <button
                      id="enhance-post-btn"
                      type="button"
                      onClick={handleEnhance}
                      disabled={!newPostContent.trim() || isEnhancing || isUploading}
                      title="Improve writing with AI"
                      aria-label="Enhance post with AI"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer
                        text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200
                        dark:text-indigo-400 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 dark:border-indigo-900/60
                        disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isEnhancing
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Sparkles className="w-3.5 h-3.5" />
                      }
                      {isEnhancing ? 'Enhancing…' : 'Enhance'}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!newPostContent.trim() || isUploading}
                    className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3 h-3" /> Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {displayedPosts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
          <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-450 text-sm">No posts found in this category.</p>
        </div>
      ) : displayedPosts.map((post) => {
        const isLiked = post.likedBy?.includes(currentUser.id || currentUser._id);
        const isExpanded = expandedPostId === (post.id || post._id);

        return (
          <div key={post.id || post._id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-200 group">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <img src={post.author?.avatar || `https://ui-avatars.com/api/?name=Deleted+User&background=94a3b8&color=fff`} alt={post.author?.name || 'Deleted User'} className={`w-12 h-12 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800 ${post.author?.avatar && !post.author.avatar.includes('ui-avatars.com') ? 'avatar-saturate' : ''}`} />
                  <div>
                    <h3 className="font-semibold text-slate-850 dark:text-white">{post.author?.name || 'Deleted User'}</h3>
                    {post.author && (post.author.role === 'GRADUATE' || post.author.role === 'alumni') && (post.author.currentCompany || post.author.company || post.author.jobTitle || post.author.title) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {(() => {
                          const jt = post.author.jobTitle || post.author.title;
                          const co = post.author.currentCompany || post.author.company;
                          if (jt && co) return `${jt} at ${co}`;
                          return jt || co;
                        })()}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 dark:text-slate-500">{post.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
                    ${post.type === 'ACHIEVEMENT' ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' :
                      post.type === 'ADVICE' ? 'bg-amber-100 dark:bg-amber-955/35 text-amber-700 dark:text-amber-400' : 
                      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350'}`}>
                    {post.type === 'ACHIEVEMENT' && <Award className="w-3 h-3" />}
                    {post.type === 'ADVICE' && <Lightbulb className="w-3 h-3" />}
                    {post.type}
                  </div>
                  {(currentUser.role?.toLowerCase() === 'admin') && (
                    <button
                      onClick={() => handleDeletePost(post.id || post._id)}
                      className="p-2 text-slate-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                      title="Delete Post"
                      aria-label="Delete Post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>

              {post.image && (
                <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 max-h-96">
                  <img src={post.image} className="w-full h-full object-cover animate-kenburns" alt="Post media" />
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {(post.tags || []).map(tag => (
                  <span key={tag} className="text-xs text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded-md font-medium">#{tag}</span>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/30 px-5 py-3 border-t border-slate-100 dark:border-slate-805 flex items-center gap-6">
              <button
                onClick={() => handleLike(post.id || post._id)}
                className={`flex items-center gap-2 transition-colors text-sm font-medium cursor-pointer group ${isLiked ? 'text-rose-500' : 'text-slate-505 dark:text-slate-400 hover:text-rose-505'
                  }`}
              >
                <Heart className={`w-4 h-4 group-hover:scale-110 transition-transform ${isLiked ? 'fill-rose-500' : ''}`} />
                {post.likes}
              </button>
              <button
                onClick={() => toggleComments(post.id || post._id)}
                className={`flex items-center gap-2 transition-colors text-sm font-medium cursor-pointer ${isExpanded ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-505 dark:text-slate-400 hover:text-indigo-600'
                  }`}
              >
                <MessageSquare className="w-5 h-5" />
                {post.comments}
              </button>
              <button
                onClick={() => handleShare(post.id || post._id)}
                className="flex items-center gap-2 text-slate-505 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-sm font-medium ml-auto cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                {copiedPostId === (post.id || post._id) ? 'Link Copied!' : 'Share'}
              </button>
            </div>

            {/* Comments Section */}
            {isExpanded && (
              <div className="bg-slate-50 dark:bg-slate-950/50 px-5 pb-5 border-t border-slate-100 dark:border-slate-805 animate-in fade-in duration-200">
                <div className="space-y-4 pt-4">
                  {post.commentsList && post.commentsList.length > 0 ? (
                    post.commentsList.map(comment => (
                      <div key={comment.id || comment._id} className="flex gap-3">
                        <img src={comment.authorAvatar} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800" alt="commenter" />
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-850 flex-1">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{comment.authorName}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">{comment.timestamp}</span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-center text-slate-400 dark:text-slate-500 py-2">No comments yet. Be the first!</p>
                  )}
                </div>

                <form onSubmit={(e) => handlePostComment(e, post.id || post._id)} className="mt-4 flex gap-2">
                  <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800" alt="me" />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full pl-4 pr-12 py-2.5 rounded-full text-sm form-input-custom"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full disabled:opacity-50 transition-all duration-200 cursor-pointer"
                      aria-label="Post Comment"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

