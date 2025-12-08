module.exports = {
    HOST: "localhost", 
    USER: "Admin", //Field to change
    PASSWORD: "Admin", //Field to change
    DB: "home_decoration",
    dialect: "mysql",
    port: 3306, // Check that this port is 3306
    pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
    }
   };
   
   