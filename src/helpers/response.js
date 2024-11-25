exports.sendResponse = async (res, stautus_code, status, error, message, data) => {
    res.status(stautus_code).json({
        status,
        error,
        message,
        data
    })
}