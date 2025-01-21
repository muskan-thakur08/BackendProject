class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong...", errors = [],stack="") {
        super(message); // Call the parent Error class's constructor
        this.statusCode = statusCode; // Set HTTP status code
        this.success = false; // Indicate failure
        this.errors = errors; // Store additional error details
        this.data=null;
        this.message=message;
    }
}

export  {ApiError};
