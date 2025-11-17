module.exports = (err, req, res, next) => {

    // Erreur de validation Mongoose
    if (err.name === "ValidationError") {
        const errors = {};

        Object.keys(err.errors).forEach((key) => {
            errors[key] = err.errors[key].message;
        });

        return res.status(400).json({
            message: "Erreur de validation",
            errors: errors
        });
    }

    // Autres erreurs
    res.status(500).json({
        message: err.message || "Erreur serveur"
    });
};
