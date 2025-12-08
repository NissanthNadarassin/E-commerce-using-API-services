<template>
    <div class="Search_container">
      <h3>Find What You Need</h3>
      <div class="Search">
            <input @keydown.enter="emit_search" v-model="search_text" type="text" name="" id="" placeholder="What are you looking for ?">
            <button class="Search_button" @click="emit_search" ><font-awesome-icon :icon="['fas', 'magnifying-glass']" /></button>
            <button class="Search_Reset" @click="reset_product_list">Reset</button>
      </div>
    </div>
    
</template>

<script>
  
  export default {
    name: "SearchBar",
    props: {
      products: Array,
    },
    data(){
      return{
        search_text:"",
        saved_search_text:"",
      }
    },
    methods:{
        emit_search(){
            this.saved_search_text = this.search_text;
            this.$emit("search", this.saved_search_text)
           
            this.saved_search_text = ""
        },
        reset_product_list(){
            this.search_text = "";
            this.$emit("reset_list")

        }
    }
  };
</script>

<style scoped>
    .Search_container{
      background-color: gray;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .Search_container h3{
      padding: 10px;
    }

    .Search{
        width: 100%;
        height: 60px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0;
    }
    .Search input[type="text"]{
        width: 60%;
        height: 50%;
        border-radius: 10px 0 0 10px;
        border: none;
        padding-left: 10px;
        outline: none; 

    }

    
    .Search_button{
        width: 10%;
        height: 50%;
        border: none;
        border-radius: 0 10px 10px 0;
        cursor: pointer;
    }
    .Search_Reset{
        width: 60px;
        margin-left: 20px;
        height: 50%;
        border-radius: 20px;
        border: none;
        cursor: pointer;
        
    }
</style>