import axios from "axios";


const EntityService = {
  getEntities: function () {
    
    return axios.get("/entities");
  },

  addEntity: function (entityData) {
    return axios.post("/entities", entityData);
  },

  updateEntity: function (entityData) {
    return axios.put("/entities", entityData);
  },
  

};


export default EntityService;

