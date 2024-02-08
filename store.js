import {
  fetchTokboxCredentials as fetchTokboxCredentialsAPI,
  postCallcheck as postCallcheckAPI,
} from '@/api';

export const TOKBOX_CREDENTIALS = 'TOKBOX_CREDENTIALS';

const initialState = {
  tokboxCredentials: {},
  audio: null,
  video: null,
};

const getters = {
  getTokboxCredentials: state => state.tokboxCredentials,
  getAudio: state => state.audio,
  getVideo: state => state.video,
};

const actions = {
  async fetchTokboxCredentials({ commit }) {
    try {
      const tokboxCredentials = await fetchTokboxCredentialsAPI();
      commit(TOKBOX_CREDENTIALS, tokboxCredentials);
    } catch (e) {
      return Promise.reject(e);
    }
    return Promise.resolve();
  },

  async postCallcheck({ commit }, data) {
    try {
      await postCallcheckAPI(data);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  },

  async resetTests({ commit }) {
    commit('resetData');
  },
};

const mutations = {
  [TOKBOX_CREDENTIALS](state, credentials) {
    state.tokboxCredentials = credentials;
  },
  setTestResults(state, data) {
    if (data.audio) {
      state.audio = data.audio;
    }
    if (data.video) {
      state.video = data.video;
    }
  },
  resetData(state) {
    console.log('reseting..'); //eslint-disable-line
    state.audio = null;
    state.video = null;
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
