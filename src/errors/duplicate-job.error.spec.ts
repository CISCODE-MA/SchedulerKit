import { DuplicateJobError } from "./duplicate-job.error";

describe("DuplicateJobError", () => {
  it("is an instance of Error", () => {
    expect(new DuplicateJobError("job")).toBeInstanceOf(Error);
  });

  it("has name DuplicateJobError", () => {
    expect(new DuplicateJobError("job").name).toBe("DuplicateJobError");
  });

  it("message contains the job name", () => {
    expect(new DuplicateJobError("send-report").message).toContain("send-report");
  });

  it("can be caught with instanceof check", () => {
    try {
      throw new DuplicateJobError("my-job");
    } catch (e) {
      expect(e).toBeInstanceOf(DuplicateJobError);
    }
  });
});
