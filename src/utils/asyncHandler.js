const  asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((error) => next(error));
    }
}

export {asyncHandler}




// For Understanding:
// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}         ---> This is higher order function that takes a function as an argument and returns a new function.
// const asyncHandler = (func) => async () => {}




// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message,
//         })
//     }
// }

// export {asyncHandler};