export const notFoundHandler = (_req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Resource not found',
    });
};
export const errorHandler = (err, _req, res, _next) => {
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    if (statusCode === 500) {
        console.error('[error]', err);
    }
    res.status(statusCode).json({
        status: 'error',
        message: err?.message ?? 'Internal server error',
    });
};
