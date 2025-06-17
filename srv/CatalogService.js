module.exports = async function (srv) {
    const { Employees } = srv.entities;

    srv.on("bulkInsert", async (req) => {
        const data = req.data.records;
        if (!Array.isArray(data)) return req.error(400, "Invalid data format");

        await INSERT.into(Employees).entries(data);
        return { message: "Data inserted successfully" };
    });
};
