import { Handler } from "@netlify/functions"
import moment from "moment";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Origin": "https://uhaka.io",
}

type Request = {
  location_ext_ids: string[];
}

const err = (message) => ({ statusCode: 400, body: JSON.stringify({ success: false, message }) });
const ok = (payload) => ({ statusCode: 400, body: JSON.stringify({ success: true, data: payload }) });

const handler: Handler = async (event, context) => {
  const body = JSON.parse(event.body) as Request;
  const locationIds = body.location_ext_ids;
  const [dateString] = event.path.split("/").slice(-1);
  if (!dateString) {
    return err("Invalid date");
  }
  const date = moment(dateString, "YYYY-MM-DD");
  if (!date.isValid()) {
    return err("Invalid date");
  }
  if (!locationIds || !Array.isArray(locationIds)) {
    return err("Invalid location_ext_ids");
  }
  if (!locationIds.length) {
    return err("Invalid location_ext_ids");
  }
  if (!locationIds.some((loc) => typeof loc === "string")){
    return err("Invalid location_ext_ids");
  }

  const urls = locationIds.map(
    (id) => `${process.env.PROXY_URL}/public/locations/${id}/date/${date}`
  );


  return { statusCode: 200, body: JSON.stringify({ urls }) };
};


export { handler }