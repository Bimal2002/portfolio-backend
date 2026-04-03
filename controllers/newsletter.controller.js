const crypto = require('crypto');
const NewsletterSubscription = require('../models/NewsletterSubscription');
const NewsletterCampaign = require('../models/NewsletterCampaign');
const { sendNewsletterEmail, sendOptInEmail } = require('../utils/email');

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
exports.subscribe = async (req, res) => {
  try {
    const { ownerId, email, doubleOptIn } = req.body;
    if (!ownerId || !email) return res.status(400).json({ success: false, message: 'Missing fields' });

    // Upsert subscription
    let sub = await NewsletterSubscription.findOne({ owner: ownerId, email });
    if (!sub) {
      sub = new NewsletterSubscription({ owner: ownerId, email });
    }

    if (doubleOptIn) {
      sub.status = 'pending';
      sub.confirmToken = crypto.randomBytes(24).toString('hex');
    } else {
      sub.status = 'active';
    }

    if (!sub.unsubscribeToken) {
      sub.unsubscribeToken = crypto.randomBytes(24).toString('hex');
    }

    await sub.save();

    if (doubleOptIn) {
      await sendOptInEmail({ email, token: sub.confirmToken });
    }

    res.status(201).json({ success: true, data: { status: sub.status } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ success: true });
    }
    res.status(500).json({ success: false, message: 'Error subscribing' });
  }
};

// @desc    Confirm subscription via token
// @route   GET /api/newsletter/confirm/:token
// @access  Public
exports.confirmSubscription = async (req, res) => {
  try {
    const { token } = req.params;
    const sub = await NewsletterSubscription.findOne({ confirmToken: token, status: 'pending' });
    if (!sub) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    sub.status = 'active';
    sub.confirmToken = undefined;
    await sub.save();
    res.status(200).json({ success: true, message: 'Subscription confirmed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error confirming subscription' });
  }
};

// @desc    Unsubscribe via token
// @route   GET /api/newsletter/unsubscribe/:token
// @access  Public
exports.unsubscribe = async (req, res) => {
  try {
    const { token } = req.params;
    const sub = await NewsletterSubscription.findOne({ unsubscribeToken: token, status: { $ne: 'unsubscribed' } });
    if (!sub) return res.status(400).json({ success: false, message: 'Invalid unsubscribe token' });
    sub.status = 'unsubscribed';
    sub.unsubscribedAt = new Date();
    await sub.save();
    res.status(200).json({ success: true, message: 'You have been unsubscribed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing unsubscribe' });
  }
};

// @desc    List subscribers
// @route   GET /api/newsletter/subscribers
// @access  Private
exports.listSubscribers = async (req, res) => {
  try {
    const items = await NewsletterSubscription.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subscribers' });
  }
};

// @desc    Get all newsletter campaigns
// @route   GET /api/newsletter/campaigns
// @access  Private
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await NewsletterCampaign.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching campaigns'
    });
  }
};

// @desc    Get single campaign
// @route   GET /api/newsletter/campaigns/:id
// @access  Private
exports.getCampaign = async (req, res) => {
  try {
    const campaign = await NewsletterCampaign.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching campaign'
    });
  }
};

// @desc    Create newsletter campaign
// @route   POST /api/newsletter/campaigns
// @access  Private
exports.createCampaign = async (req, res) => {
  try {
    const { subject, content, htmlContent } = req.body;

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Subject and content are required'
      });
    }

    const campaign = new NewsletterCampaign({
      user: req.user.id,
      subject,
      content,
      htmlContent: htmlContent || content,
      status: 'draft'
    });

    await campaign.save();

    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating campaign'
    });
  }
};

// @desc    Update newsletter campaign
// @route   PUT /api/newsletter/campaigns/:id
// @access  Private
exports.updateCampaign = async (req, res) => {
  try {
    let campaign = await NewsletterCampaign.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only edit draft campaigns'
      });
    }

    const { subject, content, htmlContent } = req.body;
    if (subject) campaign.subject = subject;
    if (content) campaign.content = content;
    if (htmlContent) campaign.htmlContent = htmlContent;

    await campaign.save();

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating campaign'
    });
  }
};

// @desc    Send newsletter campaign
// @route   POST /api/newsletter/campaigns/:id/send
// @access  Private
exports.sendCampaign = async (req, res) => {
  try {
    const campaign = await NewsletterCampaign.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Campaign already sent'
      });
    }

    // Get all subscribers for this user
    const subscribers = await NewsletterSubscription.find({ owner: req.user.id });

    if (subscribers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No subscribers to send to'
      });
    }

    campaign.totalRecipients = subscribers.length;
    campaign.status = 'sent';
    campaign.sentAt = new Date();

    // Send emails to all subscribers
    let successCount = 0;
    let failureReasons = [];

    for (const subscriber of subscribers) {
      try {
        if (subscriber.status !== 'active') continue;
        await sendNewsletterEmail({
          email: subscriber.email,
          subject: campaign.subject,
          content: campaign.htmlContent || campaign.content,
          senderName: req.user.fullName,
          campaignId: campaign._id.toString(),
          unsubscribeToken: subscriber.unsubscribeToken
        });
        successCount++;
      } catch (error) {
        failureReasons.push({
          email: subscriber.email,
          error: error.message
        });
      }
    }

    campaign.successfulSends = successCount;
    campaign.failedSends = subscribers.length - successCount;
    campaign.failureReasons = failureReasons;

    await campaign.save();

    res.status(200).json({
      success: true,
      message: `Newsletter sent to ${successCount}/${subscribers.length} subscribers`,
      data: campaign
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending campaign: ' + error.message
    });
  }
};

// @desc    Track open via pixel
// @route   GET /api/newsletter/open/:campaignId.png
// @access  Public
exports.trackOpen = async (req, res) => {
  try {
    const { campaignId } = req.params;
    await NewsletterCampaign.findByIdAndUpdate(campaignId, { $inc: { openedCount: 1 } });
  } catch (e) {}
  const img = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8z8DwHwAFVgJz2qP1kgAAAABJRU5ErkJggg==',
    'base64'
  );
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.end(img);
};

// @desc    Track click and redirect
// @route   GET /api/newsletter/click/:campaignId
// @access  Public
exports.trackClick = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const url = req.query.url;
    if (!url) return res.status(400).send('Missing url');
    await NewsletterCampaign.findByIdAndUpdate(campaignId, { $inc: { clickCount: 1 } });
    return res.redirect(url);
  } catch (e) {
    return res.status(302).redirect(req.query.url || '/');
  }
};

// @desc    Delete newsletter campaign
// @route   DELETE /api/newsletter/campaigns/:id
// @access  Private
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await NewsletterCampaign.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Campaign deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting campaign'
    });
  }
};

// @desc    Get newsletter stats
// @route   GET /api/newsletter/stats
// @access  Private
exports.getNewsletterStats = async (req, res) => {
  try {
    const totalSubscribers = await NewsletterSubscription.countDocuments({ owner: req.user.id });
    const campaigns = await NewsletterCampaign.find({ user: req.user.id });
    const sentCampaigns = campaigns.filter(c => c.status === 'sent');
    const totalSent = sentCampaigns.reduce((sum, c) => sum + c.successfulSends, 0);
    const totalOpened = sentCampaigns.reduce((sum, c) => sum + c.openedCount, 0);

    res.status(200).json({
      success: true,
      data: {
        totalSubscribers,
        totalCampaigns: campaigns.length,
        sentCampaigns: sentCampaigns.length,
        draftCampaigns: campaigns.filter(c => c.status === 'draft').length,
        totalEmailsSent: totalSent,
        totalOpened,
        averageOpenRate: sentCampaigns.length > 0 ? Math.round((totalOpened / totalSent) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
};

// @desc    Send direct email to single subscriber
// @route   POST /api/newsletter/send-direct
// @access  Private
exports.sendDirectEmail = async (req, res) => {
  try {
    const { email, subject, content } = req.body;
    
    if (!email || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, subject, content'
      });
    }

    // Verify email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Send email
    await sendNewsletterEmail({
      email,
      subject,
      content,
      senderName: req.user.fullName
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Error sending direct email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending email: ' + error.message
    });
  }
};
