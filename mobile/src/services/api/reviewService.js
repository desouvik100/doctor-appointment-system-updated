import apiClient from './apiClient';

/**
 * Review Service - Handle Patient Reviews, Replies, and Votes
 */

export const createReview = async (reviewData) => {
  const response = await apiClient.post('/reviews', reviewData);
  return response.data;
};

export const getDoctorReviews = async (doctorId, params = {}) => {
  const response = await apiClient.get(`/reviews/${doctorId}`, { params });
  return response.data;
};

export const postReviewReply = async (reviewId, text, parentId = null) => {
  const response = await apiClient.post(`/reviews/${reviewId}/reply`, { text, parentId });
  return response.data;
};

export const voteReviewHelpful = async (reviewId, voteType = 'helpful') => {
  const response = await apiClient.post(`/reviews/${reviewId}/helpful`, { voteType });
  return response.data;
};

export const deleteReview = async (reviewId) => {
  const response = await apiClient.delete(`/reviews/${reviewId}`);
  return response.data;
};

export const updateReview = async (reviewId, reviewData) => {
  const response = await apiClient.put(`/reviews/${reviewId}`, reviewData);
  return response.data;
};

export default {
  createReview,
  getDoctorReviews,
  postReviewReply,
  voteReviewHelpful,
  deleteReview,
  updateReview,
};
