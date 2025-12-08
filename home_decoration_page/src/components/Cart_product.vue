<template>
    <div class="cart_product">
        <img :src="product.img" alt="product">
        <div class="product_details">
            <h2 @click="handleClick">{{ product.product_name }}</h2>
            <h4>Category : {{ product.category }}</h4>
            <p>{{ product.description }}</p>
            <div class="button_container">
                <div class="add_reduce_container">
                    <button @click="$emit('reduce_cart')">-</button>
                    <p>{{ product.quantity_cart }}</p>
                    <button @click="$emit('update-cart')">+</button>
                </div>
                <button class="remove_product" @click="$emit('remove-product')">Remove from the cart</button>
            </div>
        </div>
        <div>
            <h2>Price: {{ product.price * product.quantity_cart }} $</h2>
        </div>
    </div>
</template>

<script>
export default {
    name: "Cart_product",
    props: {
        product: {
            type: Object,
            required: true,
        },
    },
    methods: {
        handleClick() {
            this.$emit("product-clicked", this.product.id);
        },
    },
};
</script>


<style scoped>
    .cart_product{
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: space-evenly;
        align-items: start;
        padding: 20px;
        border-bottom: 2px solid gray;
        gap: 20px;
    }
    .cart_product img{
        width: 200px;
        height: 200px;
        border: 1px solid gray;
    }
    .product_details{
        display: flex;
        flex-direction: column;
        gap:10px;
        width: 50%;
        height: 50%;

    }

    .product_details h2{
        color: #243E36;
        cursor: pointer;
    }

    .button_container{
        display: flex;
        gap: 20px;
    }

    .remove_product{
        border: none;
        border-radius: 20px;
        background-color: #243E36;
        color: white;
        padding-left: 10px;
        padding-right: 10px;
        font-weight: bold;
        cursor: pointer;

    }

    .add_reduce_container{
        width: 90px;
        display: flex;
        align-items: center;
        background-color: #243E36;
        border-radius: 20px;        
    }

    .add_reduce_container p{
        text-align: center;
        width: 30px;
        color: white;
    }

    .add_reduce_container button{
        cursor: pointer;

        width: 35px;
        height: 30px;
        border: none;
        background-color: #243E36;
        color: white;
        font-weight: bold;

    }

    .add_reduce_container button:first-child{
        border-radius: 10px 0 0 10px;
        border-right: 1px solid white;
    }

    .add_reduce_container button:nth-child(3){
        border-radius: 0px 10px 10px 0px;
        border-left: 1px solid white;
    }
    @media (max-width: 800px){
        .cart_product{
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }

        .add_reduce_container{
            height: 30px;
        }

        
        .remove_product{
            font-size: 10px;
            padding: 10px;
        }
        .button_container{
            margin: 20px;
            flex-direction: column;
            align-items: center;
        }

    }
</style>