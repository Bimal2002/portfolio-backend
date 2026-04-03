// Generic CRUD controller factory
const { parsePagination } = require('../utils/paginate');

const getAll = (Model) => async (req, res) => {
  try {
    const baseQuery = req.query.userId ? { user: req.query.userId, isVisible: true } : { user: req.user.id };
    const { page, limit, sort, order } = parsePagination(req.query);

    // Default sort: explicit order, then recent first
    const defaultSort = { order: 1, startDate: -1, createdAt: -1 };

    if (page && limit) {
      const skip = (page - 1) * limit;
      const sortSpec = sort ? { [sort]: order } : defaultSort;
      const [items, total] = await Promise.all([
        Model.find(baseQuery).sort(sortSpec).skip(skip).limit(limit),
        Model.countDocuments(baseQuery)
      ]);

      return res.status(200).json({
        success: true,
        count: items.length,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        data: items
      });
    }

    const items = await Model.find(baseQuery).sort(defaultSort);
    return res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error fetching ${Model.modelName.toLowerCase()}s`
    });
  }
};

const getOne = (Model) => async (req, res) => {
  try {
    const item = await Model.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `${Model.modelName} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error fetching ${Model.modelName.toLowerCase()}`
    });
  }
};

const createOne = (Model) => async (req, res) => {
  try {
    req.body.user = req.user.id;
    const item = await Model.create(req.body);

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error creating ${Model.modelName.toLowerCase()}`,
      error: error.message
    });
  }
};

const updateOne = (Model) => async (req, res) => {
  try {
    let item = await Model.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `${Model.modelName} not found`
      });
    }

    if (item.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    item = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error updating ${Model.modelName.toLowerCase()}`
    });
  }
};

const deleteOne = (Model) => async (req, res) => {
  try {
    const item = await Model.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `${Model.modelName} not found`
      });
    }

    if (item.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await item.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error deleting ${Model.modelName.toLowerCase()}`
    });
  }
};

module.exports = {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne
};
