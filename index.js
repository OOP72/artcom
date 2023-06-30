const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const redis = require("redis");
const cors = require("cors");
const RedisStore = require('connect-redis').default;

const {
	MONGO_USER, 
	MONGO_PASSWORD, 
	MONGO_IP, 
	MONGO_PORT,
	REDIS_URL,
	SESSION_SECRET,
	REDIS_PORT,
} = require("./config/config");

const redisClient = redis.createClient({ url: `redis://${REDIS_URL}:${REDIS_PORT}` });

redisClient.connect().catch(console.error)


const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();

const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`;

const connectWithRetry = () => {
	mongoose
	.connect(mongoURL, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => console.log("successfully connected to DB"))
	.catch((e) => {
		console.log(e)
		setTimeout(connectWithRetry, 5000)
	});
}

connectWithRetry();

//Alle Header Daten an Express weitergeben
app.enable("trust proxy");
app.use(cors({}));
app.use(session({
    proxy: true,
    store: new RedisStore({client: redisClient}),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 30000      // in ms
    }
}));


app.use(express.json());


app.get("/api/v1",  (req, res) => {
	res.send("<h2>Heiligs Blechle</h2>");
	console.log("Ja eh!");
	});

//localhost:3000/api/posts
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`listening on port ${port}`));