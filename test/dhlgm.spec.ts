import fs from "fs";
import { DhlGmClient, IDhlgmRequestOptions } from "../src/carriers/dhlgm";
import { IActivity, ITrackitResponseData, STATUS_TYPES } from "../src/trackitClient";

const handleError = (e: unknown) => {
  if (e) {
    throw new Error("This should never have been reached");
  }
};

const verifyActivity = (act: IActivity, ts: string, loc: string, details: string) => {
  expect(act.timestamp).toEqual(new Date(ts));
  expect(act.location).toBe(loc);
  expect(act.details).toBe(details);
};

describe("DHL Global Mail client", () => {
  let _dhlgmClient: DhlGmClient = null;

  beforeAll(() => (_dhlgmClient = new DhlGmClient({})));

  describe("integration tests", () => {
    let _package: ITrackitResponseData<IDhlgmRequestOptions> = null;

    describe("in transit package", () => {
      beforeAll((done) =>
        fs.readFile("test/stub_data/dhlgm_intransit.html", "utf8", (err, docs) => {
          handleError(err);
          _dhlgmClient.presentResponse(docs, { trackingNumber: "trk" }).then(({ err: respErr, data: resp }) => {
            expect(respErr).toBeFalsy();
            _package = resp;
            done();
          }, handleError);
        })
      );

      it("has a status of en-route", () => expect(_package.status).toBe(STATUS_TYPES.EN_ROUTE));

      it("has a service of Direct Priority", () => expect(_package.service).toBe("GM Parcel Direct Priority"));

      it("has a weight of 0.25 lbs", () => expect(_package.weight).toBe("0.25 lbs"));

      it("has destination of CAIRNS, QLD 4870 AUSTRALIA", () =>
        expect(_package.destination).toBe("CAIRNS, QLD 4870 AUSTRALIA"));

      it("has 5 activities with timestamp, location and details", () => {
        expect(_package.activities).toHaveLength(5);
        verifyActivity(_package.activities[0], "Mar 27 2014 3:00 pm", "Brisbane, AU", "Cleared Customs");
        verifyActivity(
          _package.activities[4],
          "Mar 20 2014 4:07 am",
          "Des Plaines, IL, US",
          "Arrival DHL Global Mail Facility"
        );
      });
    });

    describe("delivered package", () => {
      beforeAll((done) =>
        fs.readFile("test/stub_data/dhlgm_delivered.html", "utf8", (err, docs) => {
          handleError(err);
          _dhlgmClient.presentResponse(docs, { trackingNumber: "trk" }).then(({ err: respErr, data: resp }) => {
            expect(respErr).toBeFalsy();
            _package = resp;
            done();
          }, handleError);
        })
      );

      it("has a status of delivered", () => expect(_package.status).toBe(STATUS_TYPES.DELIVERED));

      it("has a service of SM Parcels Expedited", () => expect(_package.service).toBe("SM Parcels Expedited"));

      it("has a weight of 0.989 lbs", () => expect(_package.weight).toBe("0.989 lbs"));

      it("has destination of Seaford, NY", () =>
        expect(_package.destination).toEqual("Seaford, NY 11783 UNITED STATES"));

      it("has 11 activities with timestamp, location and details", () => {
        expect(_package.activities).toHaveLength(11);
        verifyActivity(_package.activities[0], "2015-09-18T15:48:00", "Seaford, NY, US", "Delivered");
        verifyActivity(_package.activities[10], "2015-09-14T15:06:00", "", "Electronic Notification Received");
      });
    });

    describe("en-route package with eta", () => {
      beforeAll((done) =>
        fs.readFile("test/stub_data/dhlgm_eta.html", "utf8", (err, docs) => {
          handleError(err);
          _dhlgmClient.presentResponse(docs, { trackingNumber: "trk" }).then(({ err: respErr, data: resp }) => {
            expect(respErr).toBeFalsy();
            _package = resp;
            done();
          }, handleError);
        })
      );

      it("has a status of en-route", () => expect(_package.status).toBe(STATUS_TYPES.EN_ROUTE));

      it("has an eta of October 7th", () => expect(_package.eta).toEqual(new Date("2015-10-07T23:59:59Z")));
    });
  });
});
