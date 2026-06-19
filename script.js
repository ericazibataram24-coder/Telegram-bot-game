// Initialize the Telegram Web App interface
const tg = window.Telegram.WebApp;
tg.expand(); // Forces the Mini App to take the full screen height inside Telegram

// CONFIGURATION (Your active bot token and channel are now fully integrated)
const BOT_TOKEN = "8947362838:AAEOSyvSRQgDNXI-JRxI3OCFLoh65OUKjz0"; 
const CHANNEL_USERNAME = "@webdevadmin"; 

document.addEventListener('DOMContentLoaded', () => {
        const postForm = document.getElementById('postForm');

            postForm.addEventListener('submit', async (e) => {
                        e.preventDefault(); 

                                // Extract values from the inputs
                                        const title = document.getElementById('postTitle').value;
                                                const category = document.getElementById('postCategory').value;
                                                        const content = document.getElementById('postContent').value;

                                                                // Clean layout format for the Telegram Channel message
                                                                        const formattedMessage = `📝 *NEW POST PUBLISHED*\n\n*Title:* ${title}\n*Category:* 🏷️ ${category.toUpperCase()}\n\n*Content:*\n${content}\n\n_Published via Mini App Dashboard_`;

                                                                                // Telegram Bot API request path structure
                                                                                        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

                                                                                                try {
                                                                                                                const response = await fetch(telegramUrl, {
                                                                                                                                    method: 'POST',
                                                                                                                                                    headers: {
                                                                                                                                                                            'Content-Type': 'application/json'
                                                                                                                                                    },
                                                                                                                                                                    body: JSON.stringify({
                                                                                                                                                                                            chat_id: CHANNEL_USERNAME,
                                                                                                                                                                                                                text: formattedMessage,
                                                                                                                                                                                                                                    parse_mode: 'Markdown'
                                                                                                                                                                    })
                                                                                                                });

                                                                                                                            if (response.ok) {
                                                                                                                                                // Displays beautiful native Telegram overlay window alert
                                                                                                                                                                tg.showPopup({
                                                                                                                                                                                        title: '🎉 Live on Telegram!',
                                                                                                                                                                                                            message: 'Your article was blasted successfully to your channel.',
                                                                                                                                                                                                                                buttons: [{type: 'ok'}]
                                                                                                                                                                });
                                                                                                                                                                                
                                                                                                                                                                                                // Triggers subtle phone vibration feedback on completion (mobile devices support)
                                                                                                                                                                                                                if (tg.HapticFeedback) {
                                                                                                                                                                                                                                        tg.HapticFeedback.notificationOccurred('success');
                                                                                                                                                                                                                }
                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                postForm.reset(); 
                                                                                                                            } else {
                                                                                                                                                tg.showAlert('⚠️ Telegram system refused message. Verify Channel Admin settings or Token value details.');
                                                                                                                            }
                                                                                                } catch (error) {
                                                                                                                console.error('Error:', error);
                                                                                                                            tg.showAlert('❌ Failed connecting out to server link. Please recheck your network connectivity layout.');
                                                                                                }
            });
});

                                                                                                }
                                                                                                                            }
                                                                                                                                                                                                                }
                                                                                                                                                                })
                                                                                                                            }
                                                                                                                                                                    })
                                                                                                                                                    }
                                                                                                                })
                                                                                                }
            })
})