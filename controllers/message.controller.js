const Message = require('../models/Message');
const User = require('../models/User');
const crypto = require('crypto');
const { sendMessageNotification, sendReplyNotification, sendAutoResponder } = require('../utils/email');

// @desc    Get all messages for portfolio owner
// @route   GET /api/messages
// @access  Private
exports.getAllMessages = async (req, res) => {
  try {
    const query = { portfolioOwner: req.user.id };
    
    if (req.query.isRead) {
      query.isRead = req.query.isRead === 'true';
    }
    if (req.query.isArchived) {
      query.isArchived = req.query.isArchived === 'true';
    }

    const messages = await Message.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

// @desc    Get single message
// @route   GET /api/messages/:id
// @access  Private
exports.getMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.portfolioOwner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching message'
    });
  }
};

// @desc    Create message (public contact form)
// @route   POST /api/messages/user/:userId
// @access  Public
exports.createMessage = async (req, res) => {
  try {
    // Honeypot check: bots often fill hidden fields
    if (req.body.website) {
      return res.status(400).json({ success: false, message: 'Invalid submission' });
    }
    req.body.portfolioOwner = req.params.userId;
    
    // Generate reply token for visitor to reply without authentication
    req.body.replyToken = crypto.randomBytes(32).toString('hex');
    
    const message = await Message.create(req.body);

    // Send email notification to portfolio owner
    try {
      const portfolioOwner = await User.findById(req.params.userId);
      if (portfolioOwner && portfolioOwner.email) {
        await sendMessageNotification(message, portfolioOwner);
      }
      // Auto-responder to visitor if enabled
      const Portfolio = require('../models/Portfolio');
      const portfolio = await Portfolio.findOne({ user: req.params.userId });
      if (portfolio?.autoresponderEnabled) {
        await sendAutoResponder(message, portfolioOwner, portfolio.autoresponderMessage);
      }
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// @desc    Message statistics (counts)
// @route   GET /api/messages/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const owner = req.user.id;
    const [total, unread, archived, replied] = await Promise.all([
      Message.countDocuments({ portfolioOwner: owner }),
      Message.countDocuments({ portfolioOwner: owner, isRead: false, isArchived: false }),
      Message.countDocuments({ portfolioOwner: owner, isArchived: true }),
      Message.countDocuments({ portfolioOwner: owner, replies: { $exists: true, $ne: [] }, isArchived: false })
    ]);

    res.status(200).json({ success: true, data: { total, unread, archived, replied } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
};

// @desc    Update message (mark as read/archived)
// @route   PUT /api/messages/:id
// @access  Private
exports.updateMessage = async (req, res) => {
  try {
    let message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.portfolioOwner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    message = await Message.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating message'
    });
  }
};

// @desc    Add reply to conversation (Owner)
// @route   POST /api/messages/:id/reply
// @access  Private
exports.addOwnerReply = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.portfolioOwner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Add reply to conversation thread
    message.replies.push({
      sender: 'owner',
      senderName: req.user.fullName,
      message: req.body.message,
      attachments: Array.isArray(req.body.attachments) ? req.body.attachments : []
    });
    
    message.lastReplyAt = new Date();
    message.isRead = true;
    
    await message.save();

    // Send email notification to visitor
    try {
      await sendReplyNotification(message, req.user);
    } catch (emailError) {
      console.error('Failed to send reply notification email:', emailError);
    }

    res.status(200).json({
      success: true,
      data: message,
      message: 'Reply sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending reply'
    });
  }
};

// @desc    Add reply to conversation (Visitor via token)
// @route   POST /api/messages/reply/:token
// @access  Public
exports.addVisitorReply = async (req, res) => {
  try {
    const message = await Message.findOne({ replyToken: req.params.token });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message thread not found or invalid link'
      });
    }

    // Add reply to conversation thread
    message.replies.push({
      sender: 'visitor',
      senderName: message.senderName,
      message: req.body.message,
      attachments: Array.isArray(req.body.attachments) ? req.body.attachments : []
    });
    
    message.lastReplyAt = new Date();
    message.isRead = false; // Mark as unread for owner
    
    await message.save();

    // Send email notification to portfolio owner
    try {
      const portfolioOwner = await User.findById(message.portfolioOwner);
      if (portfolioOwner && portfolioOwner.email) {
        await sendMessageNotification(message, portfolioOwner, true); // true = is reply
      }
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
    }

    res.status(200).json({
      success: true,
      data: message,
      message: 'Reply sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending reply'
    });
  }
};

// @desc    Get message thread by token (for visitor)
// @route   GET /api/messages/thread/:token
// @access  Public
exports.getMessageByToken = async (req, res) => {
  try {
    const message = await Message.findOne({ replyToken: req.params.token });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message thread not found or invalid link'
      });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching message thread'
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.portfolioOwner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting message'
    });
  }
};

// @desc    Get unread count
// @route   GET /api/messages/unread/count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      portfolioOwner: req.user.id,
      isRead: false,
      isArchived: false
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count'
    });
  }
};
