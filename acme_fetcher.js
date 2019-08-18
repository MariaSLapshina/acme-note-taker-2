const API = 'https://acme-users-api-rev.herokuapp.com/api';
const fetchUser = async () => {
    const storage = window.localStorage;
    const userId = storage.getItem('userId');
    if (userId) {
        try {
            return (await axios.get(`${API}/users/detail/${userId}`)).data;
        }
        catch (e) {
            storage.removeItem('userId');
            return fetchUser();
        }
    }
    const user = (await axios.get(`${API}/users/random`)).data;
    storage.setItem('userId', user.id);
    return user;
}

const getNotes = async (userId) => {
    return (await axios.get(`${API}/users/${userId}/notes`)).data;
}

const putNotes = async ({ userId, noteId, archived, text }) => {
    return (await axios.put(`${API}/users/${userId}/notes/${noteId}`, { archived, text })).data
}

const deleteNotes = ({ userId, noteId }) => {
    return axios.delete(`${API}/users/${userId}/notes/${noteId}`)
}

const postNotes = async ({ userId, archived, text }) => {
    return (await axios.post(`${API}/users/${userId}/notes`, { archived, text })).data
}
