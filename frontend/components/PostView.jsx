import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Award, Lightbulb, ArrowLeft, Send, Sparkles } from 'lucide-react';
import { fetchSinglePost, likePost, commentPost } from '../services/api';

export const PostView = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    fetchSinglePost(id)
      .then(data => {
        setPost(data);
        setError('');
      })
      .catch(err => {
        console.error('Failed to load post:', err);
        setError(err.message || 'Failed to load post. It may have been deleted.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleLike = async () => {
    if (!currentUser) return;
    try {
      const updatedPost = await likePost(post.id || post._id, currentUser.id || currentUser._id);
      setPost(updatedPost);
    } catch (err) {
      console.error('Failed to like post:', err);
      alert('Failed to like post. Please try again.');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!currentUser || !commentText.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const updatedPost = await commentPost(post.id || post._id, commentText);
      setPost(updatedPost);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-slate-200 dark:border-slate-800">
          <p className="text-slate-800 dark:text-white font-semibold mb-4">{error || 'Post not found.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Feed
          </button>
        </div>
      </div>
    );
  }

  const isLiked = currentUser && post.likedBy?.includes(currentUser.id || currentUser._id);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-8 px-4 theme-transition">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back navigation */}
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to AlumniConnect
        </button>

        {/* Post Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <img
                  src={post.author?.avatar || `https://ui-avatars.com/api/?name=Deleted+User&background=94a3b8&color=fff`}
                  alt={post.author?.name || 'Deleted User'}
                  className={`w-12 h-12 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 ${post.author?.avatar && !post.author.avatar.includes('ui-avatars.com') ? 'avatar-saturate' : ''}`}
                />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{post.author?.name || 'Deleted User'}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-355">{post.author ? post.author.title : 'User deleted'}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : post.timestamp}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
                ${post.type === 'ACHIEVEMENT' ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' :
                  post.type === 'ADVICE' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400'}`}>
                {post.type === 'ACHIEVEMENT' && <Award className="w-3 h-3 text-green-500" />}
                {post.type === 'ADVICE' && <Lightbulb className="w-3 h-3 text-amber-500" />}
                {post.type}
              </div>
            </div>

            <div className="mt-4 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap text-base">
              {post.content}
            </div>

            {post.image && (
              <div className="mt-4 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 max-h-96">
                <img src={post.image} className="w-full h-full object-cover animate-kenburns" alt="Post media" />
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {(post.tags || []).map(tag => (
                <span key={tag} className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded-md font-medium">#{tag}</span>
              ))}
            </div>
          </div>

          {/* Engagement Panel */}
          <div className="bg-slate-50 dark:bg-slate-900/40 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-6 text-slate-500 dark:text-slate-400">
            <button
              onClick={handleLike}
              disabled={!currentUser}
              className={`flex items-center gap-2 transition-colors text-sm font-medium group cursor-pointer ${isLiked ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400 hover:text-rose-500'} ${!currentUser ? 'opacity-60 cursor-default' : ''}`}
            >
              <Heart className={`w-4 h-4 group-hover:scale-110 transition-transform ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              {post.likes}
            </button>
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="w-5 h-5 text-slate-400" />
              {post.comments} Comments
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-slate-50/50 dark:bg-slate-950/20 px-6 pb-6 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-4 pt-4">
              {post.commentsList && post.commentsList.length > 0 ? (
                post.commentsList.map(comment => (
                  <div key={comment.id || comment._id} className="flex gap-3">
                    <img src={comment.authorAvatar || `https://ui-avatars.com/api/?name=Deleted+User&background=94a3b8&color=fff`} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover bg-slate-100" alt={comment.authorName || 'Deleted User'} />
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl rounded-tl-none shadow-sm border border-slate-150 dark:border-slate-800 flex-1 text-slate-800 dark:text-slate-100">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-semibold text-xs text-slate-805 dark:text-white">{comment.authorName || 'Deleted User'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{comment.content || comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-center text-slate-400 dark:text-slate-500 py-4">No comments yet.</p>
              )}
            </div>

            {/* Comment inputs or login callout */}
            {currentUser ? (
              <form onSubmit={handlePostComment} className="mt-4 flex gap-2">
                <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover bg-slate-100" alt="me" />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    disabled={isSubmittingComment}
                    className="w-full pl-4 pr-12 py-2.5 rounded-full text-sm form-input-custom"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmittingComment}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full disabled:opacity-50 transition-all duration-200 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 dark:bg-indigo-700/80 text-white p-2 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">Join the discussion</h4>
                    <p className="text-xs text-indigo-707 dark:text-indigo-400">Log in to like posts and write comments.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Log In / Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
