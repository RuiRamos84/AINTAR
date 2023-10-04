import axios from "axios";
import Swal from "sweetalert2";

let isLoggedIn = false;



// console.log(process.env.REACT_APP_API_URL);
axios.defaults.baseURL = process.env.REACT_APP_API_URL;

axios.defaults.headers.common["Content-Type"] = "application/json"; 

axios.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    if (config.url.endsWith("/refresh")) {
      if (user.refresh_token) {
        config.headers.Authorization = `Bearer ${user.refresh_token}`;
      }
    } else if (user.access_token) {
      config.headers.Authorization = `Bearer ${user.access_token}`;
    }
  }
  return config;
});


axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status &&
      (error.response.status === 401 || error.response.status === 403) &&
      !originalRequest._retry &&
      !originalRequest.url.endsWith("/refresh")
    ) {
      originalRequest._retry = true;
      try {
        await refreshToken();
        const user = JSON.parse(localStorage.getItem("user"));
        const newRequest = {
          ...originalRequest,
          headers: {
            ...originalRequest.headers,
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.access_token}`,
          },
        };
        return axios(newRequest);
      } catch (err) {
        // Renovação de token falhou, faça o logout do usuário
        logout();

        // Exiba uma mensagem ao usuário
        Swal.fire({
          icon: "error",
          title: "Erro de autenticação",
          text: "Sua sessão expirou. Por favor, faça login novamente.",
        }).then(() => {
          // Redirecione para a página de login
          window.location.href = "/"; // Altere para o URL da sua página de login
        });

        return Promise.reject(err);
      }
    }
    if (originalRequest.url.endsWith("/refresh")) {
      // Logout do usuário
      logout();

      // Exiba uma mensagem ao usuário
      Swal.fire({
        icon: "error",
        title: "Erro de autenticação",
        text: "Sua sessão expirou. Por favor, faça login novamente.",
      }).then(() => {
        // Redirecione para a página de login
        window.location.href = "/"; // Altere para o URL da sua página de login
      });

      return Promise.resolve();
    }
    return Promise.reject(error);
  }
);



const createUser = async (userData) => {
  try {
    const response = await axios.post("/create_user_ext", userData);
    return response;
  } catch (error) {
    console.error("Erro ao criar utilizador: ", error);
    throw error;
  }
};


export const activateUser = async (id, activation_code) => {
  try {
    const response = await axios.get(`/activation/${id}/${activation_code}`);
    if (response.data.mensagem) {
      return { message: response.data.mensagem, variant: "success" };
    } else {
      return { message: response.data.erro, variant: "danger" };
    }
  } catch (error) {
    return { message: "Ocorreu um erro ao ativar a conta.", variant: "danger" };
  }
};


const login = async (username, password) => {
  try {
    const response = await axios.post("/login", { username, password });
    if (response.data.access_token && response.data.refresh_token) {
      localStorage.setItem("user", JSON.stringify(response.data));
      isLoggedIn = true;
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};


const logout = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.access_token) {
      try {
        await axios.delete("/logout");
      } catch (error) {
        console.error("Erro ao fazer logout no servidor", error);
      }
      localStorage.removeItem("user");
      isLoggedIn = false;
    }
  } catch (error) {
    console.error("Erro ao fazer logout", error);
    throw error;
  }
};


const refreshToken = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.refresh_token) {
    return null;
  }
  try {
    const response = await axios.post("/refresh", {
      refresh_token: user.refresh_token,
    });
    if (response.status === 200) {
      user.access_token = response.data.access_token;
      user.refresh_token = response.data.refresh_token;
      localStorage.setItem("user", JSON.stringify(user));
    }
    return response.data;
  } catch (error) {
    console.error("Falha ao atualizar o token", error);
    if (error.response && error.response.status === 401) {
      Swal.fire({
        title: "Sessão expirada",
        text: "Sua sessão expirou. Por favor, faça login novamente.",
        icon: "warning",
        confirmButtonText: "OK",
      }).then(() => {
        logout();
        window.location.href = "/";
      });
      return; 
    }
    throw error;
  }
};


export async function getUserInfo() {
  try {
    const response = await axios.get("/user_info");
    return response.data;
  } catch (error) {
    console.error("Error getting user info: ", error);
    Swal.fire({
      title: "Erro ao obter informações do utilizador",
      text: "Ocorreu um erro ao obter as sua informações. Por favor, faça login novamente.",
      icon: "error",
      confirmButtonText: "OK",
    }).then(() => {
      logout();
      window.location.href = "/";
    });
    throw error;
  }
}

export const updateUserInfo = async (userInfo) => {
  try {
    const response = await axios.put("/user_info", userInfo);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const changePassword = async (oldPassword, newPassword) => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.access_token) {
      const response = await axios.put("/change_password", {
        old_password: oldPassword,
        new_password: newPassword,
      });
      return response.data;
    }
  } catch (error) {
    console.error("Erro ao alterar a password", error);
    throw error;
  }
};

export const getEntities = async () => {
  try {
    const response = await axios.get("/entities");
    return response.data.entities;
  } catch (error) {
    console.error("Erro ao obter a lista de entidades", error);
    throw error;
  }
};

export const updateEntity = async (entityData) => {
  try {
    const response = await axios.put("/entities");
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar a entidade: ", error);
    throw error;
  }
};

export const createEntity = async (entity) => {
  try {
    const response = await axios.post("/entities", entity);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar entidade", error);
  }
};

export const deleteEntity = async (entityId) => {
  try {
    const response = await axios.delete(`/api/entities/${entityId}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir entidade", error);
  }
};

export const getMetaData = async (dataType) =>
  axios.get(`/metaData?tipo=${dataType}`).then((response) => response.data);


export const getNotifications = async () => {
  try {
    const response = await axios.get("/notification");
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    throw error;
  }
};

export const incrementOrderCount = async (recipient_id) => {
  try {
    await axios.post(`/notification`, { user_id: recipient_id });
  } catch (error) {
    console.error("Erro ao incrementar a contagem de pedidos:", error);
    throw error;
  }
};

export const resetOrderCount = async (user_id) => {
  try {
    await axios.delete(`/notification`, { data: { user_id } });
  } catch (error) {
    console.error("Erro ao resetar a contagem de pedidos:", error);
    throw error;
  }
};




const authService = {
  createUser,
  login,
  activateUser,
  logout,
  refreshToken,
  getUserInfo,
  updateUserInfo,
  changePassword,
  isLoggedIn,
  getEntities,
  updateEntity,
  createEntity,
  deleteEntity,
  getMetaData,
  getNotifications,
  incrementOrderCount,
  resetOrderCount,
};

export default authService;
