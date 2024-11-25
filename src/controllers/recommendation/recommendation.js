const axios = require('axios');
const response = require('../../helpers/response');

exports.getRecommendation = async (req, res) => {
    const userInput = req.body;
    console.log(userInput);

    try {
        const result = await axios.post('http://localhost:5000/recommend', userInput);
        console.log(result.data);
        return response.success(res, result.data);
    } catch (error) {
        console.error('Error getting recommendations:', error.message);
        return response.error(res, 'Error getting recommendations', 500, error.message);
    }
};
