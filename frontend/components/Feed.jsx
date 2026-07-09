import React, { useState, useRef } from 'react';
import { MessageSquare, Heart, Share2, Award, Briefcase, Lightbulb, Send, Image, X, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { UserRole } from '../types';
import { createPost, likePost, uploadImage, deletePost, enhancePostText } from '../services/api';

export const Feed = ({ posts, setPosts, currentUser, hashtagFilter, setHashtagFilter }) => {
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
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
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
    } catch (error) {
      console.error("Failed to create post", error);
      alert(error.message || "Failed to save post. Please check your credentials or try again.");
    }
  };

  const handleLike = async (postId) => {
    try {
      const updatedPost = await likePost(postId, currentUser.id || currentUser._id);
      setPosts(posts.map(post => (post.id === postId || post._id === postId) ? updatedPost : post));
    } catch (error) {
      console.error("Failed to like post", error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Delete this post permanently?")) {
      try {
        await deletePost(postId);
        setPosts(posts.filter(p => (p.id || p._id) !== postId));
      } catch (err) {
        console.error("Failed to delete post", err);
        alert(err.message || "Failed to delete post");
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
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800">Community Feed</h1>
          {hashtagFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-full text-xs font-semibold animate-in zoom-in duration-200">
              Tag: {hashtagFilter}
              <button 
                onClick={() => { if (setHashtagFilter) setHashtagFilter(null); }} 
                className="hover:text-indigo-900 focus:outline-none cursor-pointer"
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
            className="bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Posts</option>
            <option value="ACHIEVEMENT">Achievements</option>
            <option value="ADVICE">Advice</option>
            <option value="GENERAL">General</option>
          </select>
        </div>
      </div>

      {/* Create Post Section - Alumni and Students */}
      {(currentUser.role === UserRole.GRADUATE || currentUser.role === 'alumni' || currentUser.role === UserRole.UNDERGRADUATE || currentUser.role === 'student') && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex gap-3">
            <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <form onSubmit={handleCreatePost}>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share an update, advice, or opportunity..."
                  className="w-full bg-slate-50 text-slate-900 border-0 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                  rows={3}
                />
                
                {isUploading && (
                  <p className="text-xs text-emerald-600 animate-pulse mt-2">Uploading photo to Cloudinary...</p>
                )}

                {postImageUrl && (
                  <div className="mt-2 relative h-28 max-w-xs rounded-lg overflow-hidden border border-slate-200">
                    <img src={postImageUrl} className="w-full h-full object-cover" alt="Upload Preview" />
                    <button type="button" onClick={() => setPostImageUrl('')} className="absolute top-2 right-2 bg-slate-950/60 hover:bg-slate-950 text-white p-1 rounded-full">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* AI Enhanced Preview */}
                {enhancedPreview && (
                  <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-xl p-4 animate-in slide-in-from-top duration-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">AI Suggestion</span>
                    </div>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{enhancedPreview}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={handleUseEnhanced}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        ✓ Use this
                      </button>
                      <button
                        type="button"
                        onClick={handleDismissEnhanced}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg border border-slate-200 transition-colors"
                      >
                        Keep original
                      </button>
                    </div>
                  </div>
                )}

                {/* Enhance error */}
                {enhanceError && (
                  <p className="mt-2 text-xs text-rose-600 flex items-center gap-1">
                    <X className="w-3 h-3" /> {enhanceError}
                  </p>
                )}

                <div className="flex justify-between items-center mt-3">
                  <div className="flex gap-2 items-center">
                    <select
                      value={newPostType}
                      onChange={(e) => setNewPostType(e.target.value)}
                      className="text-xs bg-slate-100 border-none rounded-md px-2 py-1 text-slate-600 focus:ring-0"
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
                      className="text-slate-400 hover:text-emerald-600 p-1 disabled:opacity-50"
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
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all
                        text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200
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
                    className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
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
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No posts found in this category.</p>
        </div>
      ) : displayedPosts.map((post) => {
        const isLiked = post.likedBy?.includes(currentUser.id || currentUser._id);
        const isExpanded = expandedPostId === (post.id || post._id);

        return (
          <div key={post.id || post._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <img src={post.author.avatar} alt={post.author.name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-100" />
                  <div>
                    <h3 className="font-semibold text-slate-900">{post.author.name}</h3>
                    <p className="text-xs text-slate-500">{post.author.title}</p>
                    <p className="text-xs text-slate-400">{post.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
                    ${post.type === 'ACHIEVEMENT' ? 'bg-green-100 text-green-700' :
                      post.type === 'ADVICE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {post.type === 'ACHIEVEMENT' && <Award className="w-3 h-3" />}
                    {post.type === 'ADVICE' && <Lightbulb className="w-3 h-3" />}
                    {post.type}
                  </div>
                  {(currentUser.role?.toLowerCase() === 'admin') && (
                    <button
                      onClick={() => handleDeletePost(post.id || post._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Post"
                      aria-label="Delete Post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 text-slate-700 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>

              {post.image && (
                <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 max-h-96">
                  <img src={post.image} className="w-full h-full object-cover" alt="Post media" />
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {(post.tags || []).map(tag => (
                  <span key={tag} className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">#{tag}</span>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center gap-6">
              <button
                onClick={() => handleLike(post.id || post._id)}
                className={`flex items-center gap-2 transition-colors text-sm font-medium group ${isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
                  }`}
              >
                <Heart className={`w-4 h-4 group-hover:scale-110 transition-transform ${isLiked ? 'fill-rose-500' : ''}`} />
                {post.likes}
              </button>
              <button
                onClick={() => toggleComments(post.id || post._id)}
                className={`flex items-center gap-2 transition-colors text-sm font-medium ${isExpanded ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'
                  }`}
              >
                <MessageSquare className="w-5 h-5" />
                {post.comments}
              </button>
              <button
                onClick={() => handleShare(post.id || post._id)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium ml-auto"
              >
                <Share2 className="w-4 h-4" />
                {copiedPostId === (post.id || post._id) ? 'Link Copied!' : 'Share'}
              </button>
            </div>

            {/* Comments Section */}
            {isExpanded && (
              <div className="bg-slate-50 px-5 pb-5 border-t border-slate-100 animate-in fade-in duration-200">
                <div className="space-y-4 pt-4">
                  {post.commentsList && post.commentsList.length > 0 ? (
                    post.commentsList.map(comment => (
                      <div key={comment.id || comment._id} className="flex gap-3">
                        <img src={comment.authorAvatar} className="w-8 h-8 rounded-full border border-slate-200" alt="commenter" />
                        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-slate-100 flex-1">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="font-semibold text-xs text-slate-800">{comment.authorName}</span>
                            <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                          </div>
                          <p className="text-sm text-slate-700">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-center text-slate-400 py-2">No comments yet. Be the first!</p>
                  )}
                </div>

                <form onSubmit={(e) => handlePostComment(e, post.id || post._id)} className="mt-4 flex gap-2">
                  <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-slate-200" alt="me" />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full pl-4 pr-10 py-2 rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-800 bg-white"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="absolute right-1 top-1 p-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      aria-label="Post Comment"
                    >
                      <Send className="w-3 h-3" />
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
