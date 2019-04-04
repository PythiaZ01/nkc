var app = new Vue({
  el: "#app",
  data: {
    order: "",
    product: "",
    myStore: "",

    error: "",
    info: "",

    reason: "",
    password: "",
    money: ""
  },
  computed: {
    needPassword: function() {
      return this.order.orderStatus === "unShip";
    }
  },
  mounted: function() {
    var data = document.getElementById("data");
    data = JSON.parse(data.innerHTML);
    this.order = data.order;
    this.product = data.product;
    this.myStore = data.myStore;
  },
  methods: {
    submit: function() {
      this.error = "";
      this.info = "";
      if(this.reason === "") return this.error = "请输入理由";
      if(this.needPassword) {
        if(this.money >= 1 && this.money <= 50) {}
        else return this.error = "请输入正确的补偿金额";
      }
      nkcAPI("/shop/manage/" + this.myStore.storeId + "/order/cancel", "POST", {
        orderId: this.order.orderId,
        money: this.money,
        reason: this.reason,
        password: this.password
      })
        .then(function() {
          app.info = "订单取消成功，正在前往订单列表...";
          setTimeout(function() {
            window.location.href = "/shop/manage/" + app.myStore.storeId + "/order";
          }, 2000);
        })
        .catch(function(data) {
          app.error = data.error || data;
        })
    }
  }
});