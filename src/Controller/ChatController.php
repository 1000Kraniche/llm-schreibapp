<?php
// src/Controller/ChatController.php - FINALER VERSUCH MIT PROJEKT-KONTEXT

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Doctrine\ORM\EntityManagerInterface;

class ChatController extends AbstractController
{
    #[Route('/api/llm/chat', name: 'llm_chat', methods: ['POST'])]
    public function chat(Request $request, HttpClientInterface $http, EntityManagerInterface $em): JsonResponse
    {

        // HIER HINZUFÜGEN - ganz am Anfang der Funktion:
    set_time_limit(180); // 3 Minuten PHP Timeout
    
        $data = json_decode($request->getContent(), true);
        $prompt = $data['prompt'] ?? null;
        $projectId = $data['project_id'] ?? null;

        if (!$prompt) {
            return new JsonResponse(['error' => 'Kein Prompt gesendet.'], 400);
        }

        // DEBUG: Log was ankommt
        error_log("ChatController DEBUG: prompt='$prompt', project_id='$projectId'");

        // Projekt-Kontext aufbauen
        $context = $this->buildProjectContext($projectId, $em);
        error_log("ChatController DEBUG: Context length=" . strlen($context));
        
        // Vollständigen Prompt mit Kontext erstellen
        $fullPrompt = $context . "\n\n=== USER QUESTION ===\n" . $prompt . "\n\nPlease respond as a helpful writing assistant:";
        
        error_log("ChatController DEBUG: Full prompt length=" . strlen($fullPrompt));

        try {
            $response = $http->request('POST', 'http://host.docker.internal:11434/api/generate', [
                'json' => [
                    'model' => 'openhermes',
                    'prompt' => $fullPrompt, // <- Mit Kontext!
                    'stream' => false
                ],
                'timeout' => 120
            ]);

            $contentType = $response->getHeaders()['content-type'][0] ?? '';

            if (strpos($contentType, 'application/json') === false) {
                return new JsonResponse([
                    'error' => 'Ungültiger Inhalt vom LLM erhalten.',
                    'content_type' => $contentType,
                    'raw' => $response->getContent(false)
                ], 500);
            }

            $content = $response->toArray(false);

            if (!isset($content['response'])) {
                return new JsonResponse([
                    'error' => 'LLM hat keine gültige Antwort geliefert.',
                    'antwort' => $content
                ], 500);
            }

            return new JsonResponse(['response' => $content['response']]);

        } catch (\Throwable $e) {
            error_log("ChatController ERROR: " . $e->getMessage());
            return new JsonResponse([
                'error' => 'Fehler beim Abrufen vom LLM.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function buildProjectContext(?int $projectId, EntityManagerInterface $em): string
    {
        if (!$projectId) {
            return "=== CONTEXT ===\nNo specific project selected. You are a general writing assistant.";
        }

        try {
            // Projekt laden
            $project = $em->getRepository(\App\Entity\Project::class)->find($projectId);
            if (!$project) {
                error_log("ChatController DEBUG: Project $projectId not found");
                return "=== CONTEXT ===\nProject not found.";
            }

            error_log("ChatController DEBUG: Found project: " . $project->getTitle());

            $context = "=== PROJECT CONTEXT ===\n";
            $context .= "Project Title: " . $project->getTitle() . "\n";
            
            if ($project->getDescription()) {
                $context .= "Project Description: " . $project->getDescription() . "\n";
            }

            // Aktuelles TextDocument finden
            $textDocuments = $project->getTextDocuments();
            foreach ($textDocuments as $doc) {
                if ($doc->isCurrent()) {
                    $content = $doc->getContent();
                    $cleanContent = strip_tags($content);
                    $cleanContent = trim(preg_replace('/\s+/', ' ', $cleanContent));
                    
                    if (strlen($cleanContent) > 1000) {
                        $cleanContent = substr($cleanContent, 0, 1000) . "...";
                    }
                    
                    $context .= "\n=== CURRENT TEXT CONTENT ===\n" . $cleanContent . "\n";
                    error_log("ChatController DEBUG: Added text content, length=" . strlen($cleanContent));
                    break;
                }
            }

            // Notizen hinzufügen
            $notes = $em->getRepository(\App\Entity\Note::class)->findBy(
                ['project' => $projectId], 
                ['id' => 'DESC'], 
                3
            );
            
            if (!empty($notes)) {
                $context .= "\n=== PROJECT NOTES ===\n";
                foreach ($notes as $note) {
                    $context .= "- " . $note->getTitle();
                    if ($note->getContent()) {
                        $noteContent = strip_tags($note->getContent());
                        $noteContent = trim(preg_replace('/\s+/', ' ', $noteContent));
                        if (strlen($noteContent) > 100) {
                            $noteContent = substr($noteContent, 0, 100) . "...";
                        }
                        $context .= ": " . $noteContent;
                    }
                    $context .= "\n";
                }
                error_log("ChatController DEBUG: Added " . count($notes) . " notes");
            }

            $context .= "\n=== INSTRUCTIONS ===\n";
            $context .= "You are a helpful writing assistant for this specific project. ";
            $context .= "Use the above context to provide relevant and helpful responses. ";
            $context .= "Reference the project content when appropriate.\n";

            return $context;

        } catch (\Exception $e) {
            error_log("ChatController ERROR in buildProjectContext: " . $e->getMessage());
            return "=== CONTEXT ===\nError loading project context: " . $e->getMessage();
        }
    }
}
?>