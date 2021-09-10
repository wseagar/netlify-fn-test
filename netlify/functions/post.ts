import { Handler, HandlerEvent } from "@netlify/functions"
import moment from "moment";

type Request = {
  location_ext_ids: string[];
}

const headers = (event: HandlerEvent) => {
  let cors = "https://*--vaxxnz.netlify.app";
  if (event.headers.origin === "https://vaxx.nz") {
    cors = "https://vaxx.nz";
  }

  return {
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Origin": cors,
    "Content-Type": "application/json",
  }
}

const err = (event, message) => ({ statusCode: 400, body: JSON.stringify({ success: false, message, headers: headers(event) }) });
const ok = (event, payload) => ({ statusCode: 400, body: JSON.stringify({ success: true, data: payload, headers: headers(event) }) });

const handler: Handler = async (event, context) => {
  const body = JSON.parse(event.body) as Request;
  const locationIds = body.location_ext_ids;
  const [dateString] = event.path.split("/").slice(-1);
  if (!dateString) {
    return err(event, "Invalid date");
  }
  const date = moment(dateString, "YYYY-MM-DD");
  if (!date.isValid()) {
    return err(event, "Invalid date");
  }
  if (!locationIds || !Array.isArray(locationIds)) {
    return err(event, "Invalid location_ext_ids");
  }
  if (!locationIds.length) {
    return err(event, "Invalid location_ext_ids");
  }
  if (!locationIds.some((loc) => typeof loc === "string")) {
    return err(event, "Invalid location_ext_ids");
  }
  if (!process.env.PROXY_URL) {
    return err(event, "Env variables not configured correctly");
  }

  const urls = locationIds.map(
    (id) => `${process.env.PROXY_URL}/public/locations/${id}/date/${dateString}`
  );


  return { statusCode: 200, body: JSON.stringify({ urls }) };
};


export { handler }