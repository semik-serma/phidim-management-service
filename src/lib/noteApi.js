import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Normalizes API response to return the actual payload
 */
function unwrap(response) {
  if (response && response.data !== undefined) {
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  }
  return response;
}

/**
 * Fetches all notes
 */
export async function getNotes() {
  const response = await api.get('/note/get-notes');
  const data = unwrap(response);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notes)) return data.notes;
  return [];
}

/**
 * Fetches a single note by ID
 * @param {string} id - Note ObjectId
 */
export async function getNoteById(id) {
  if (!id) throw new Error('Note ID is required');
  const response = await api.get(`/note/get-note/${id}`);
  const data = unwrap(response);
  return data?.note || data;
}

/**
 * Creates a new note
 * @param {Object} noteData - { title, content, tommorow_tasks }
 */
export async function createNote(noteData) {
  const payload = {
    title: noteData.title?.trim() || '',
    content: noteData.content?.trim() || '',
    tommorow_tasks: noteData.tommorow_tasks?.trim() || '',
  };
  const response = await api.post('/note/create-note', payload);
  const data = unwrap(response);
  return data?.note || data;
}

/**
 * Updates an existing note
 * @param {string} id - Note ObjectId
 * @param {Object} noteData - { title, content, tommorow_tasks }
 */
export async function updateNote(id, noteData) {
  if (!id) throw new Error('Note ID is required');
  const payload = {
    ...(noteData.title !== undefined && { title: noteData.title.trim() }),
    ...(noteData.content !== undefined && { content: noteData.content.trim() }),
    ...(noteData.tommorow_tasks !== undefined && { tommorow_tasks: noteData.tommorow_tasks.trim() }),
  };
  const response = await api.put(`/note/update-note/${id}`, payload);
  const data = unwrap(response);
  return data?.note || data;
}

/**
 * Deletes a note
 * @param {string} id - Note ObjectId
 */
export async function deleteNote(id) {
  if (!id) throw new Error('Note ID is required');
  const response = await api.delete(`/note/delete-note/${id}`);
  return unwrap(response);
}

const noteApi = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
};

export default noteApi;
