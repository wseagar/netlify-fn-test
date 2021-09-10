import { Handler, HandlerEvent } from "@netlify/functions"
import moment from "moment";
import fetch from "node-fetch";

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

const err = (event, message) => ({ statusCode: 400, body: JSON.stringify({ success: false, message,  }), headers: headers(event) });
const ok = (event, payload) => ({ statusCode: 400, body: JSON.stringify({ success: true, data: payload,  }), headers: headers(event) });

const getSlots = async (url: string) => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vaccineData: "WyJhMVQ0YTAwMDAwMEhJS0NFQTQiXQ==",
      groupSize: 1,
      url: "https://app.bookmyvaccine.covid19.health.nz/appointment-select",
      timeZone: "Pacific/Auckland",
    }),
  });
  const dataStr = await res.text();
  return dataStr;
  let data;
  try {
    data = JSON.parse(dataStr);
  } catch (e) {
    console.log("Couldn't parse JSON. Response text below");
    console.log("res.status", res.status);
    console.log(dataStr);
    throw e;
  }
  return data;
};

const handler: Handler = async (event, context) => {
  if (!process.env.PROXY_URL || !process.env.VAXXNZ_SHARED_KEY) {
    return err(event, "Env variables not configured correctly");
  }
  if (event.headers["x-vaxxnz-key"] !== process.env.VAXXNZ_SHARED_KEY) {
    return err(event, "Key invalid");
  }

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
  
  const urls = locationIds.map(
    (id) => `${process.env.PROXY_URL}/public/locations/${id}/date/${dateString}/slots`
  );
  const data = await Promise.all(urls.map((url) => getSlots(url)));
  return ok(event, data);
};


export { handler }