const open = require("open");
const path = require("path");
const express = require("express");
const mercadopago = require("mercadopago");

const publicAccessToken = process.env.PUBLIC_ACCESS_TOKEN;
if (!publicAccessToken) {
  console.log("Error: public access token not defined");
  process.exit(1);
}

const accessToken = process.env.ACCESS_TOKEN;
if (!accessToken) {
  console.log("Error: access token not defined");
  process.exit(1);
}

mercadopago.configurations.setAccessToken(accessToken);

const app = express();

app.set("view engine", "html");
app.engine("html", require("hbs").__express);
app.set("views", path.join(__dirname, "views"))

app.use(express.urlencoded({ extended: false }));
app.use(express.static("./static"));
app.use(express.json());

app.get("/", function (req, res) {
  res.status(200).render("index", { publicAccessToken });
}); 

app.post("/process_payment", (req, res) => {
  const { body } = req;
  const { payer } = body;
  const paymentData = {
    transaction_amount: Number(body.transactionAmount),
    token: body.token,
    description: body.description,
    installments: Number(body.installments),
    payment_method_id: body.paymentMethodId,
    issuer_id: body.issuerId,
    payer: {
      email: payer.email,
      identification: {
        type: payer.identification.docType,
        number: payer.identification.docNumber
      }
    }
  };

  mercadopago.payment.save(paymentData)
    .then(function(response) {
      const { response: data } = response;
      res.status(response.status).json({
        status_detail: data.status_detail,
        status: data.status,
        id: data.id
      });
    })
    .catch(function(error) {
      res.status(error.status).send(error);
    });
});

app.listen(8080, () => {
  console.log("The server is now running on port 8080");
  open("http://localhost:8080");
});
