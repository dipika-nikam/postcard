const handleValidationError = (error) => {
    const errorMappings = {
        "recipientname": '"recipientname" is required',
        "address1": '"address1" is required',
        "city": '"city" is required',
        "state": '"state" is required',
        "zipcode": '"zipcode" is required',
        "message": '"message" is required'
    };

    const errorMessage = Object.entries(errorMappings)
        .find(([key, message]) => error.message.includes(key) && error.message.includes(message));

    const defaultErrorMessage = 'Recipient names must begin with a letter and only include letters.';
    const responseMessage = errorMessage ?
        `${errorMessage[0].charAt(0).toUpperCase() + errorMessage[0].slice(1)} is required, please add ${errorMessage[0]}.` :
        defaultErrorMessage;

    return responseMessage;
};

const handleFileError = (file) => {
    if (!file.mimetype.startsWith('image')) {
        throw new Error('Invalid image file');
    }
};


module.exports ={
    handleValidationError,
    handleFileError
}